import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

/**
 * PERSISTENT DOCKER EXECUTOR
 * Sends execution directives into the persistent 'clashcode-executor' container 
 * defined in your docker-compose.yml.
 */
export const runCode = async (languageInput, code, stdin = '') => {
  const language = (languageInput || '').toLowerCase().trim();
  
  // Base64 encode the code and input to bypass all Docker parsing bugs
  const base64Code = Buffer.from(code || '').toString('base64');
  const base64Stdin = Buffer.from(stdin || '').toString('base64');

  let scriptName = '';
  let runCmd = '';

  try {
    if (language === 'python') {
      scriptName = 'script.py';
      runCmd = 'python3 script.py < input.txt';
    } else if (language === 'javascript') {
      scriptName = 'script.js';
      runCmd = 'node script.js < input.txt';
    } else if (language === 'java') {
      scriptName = 'Main.java';
      runCmd = 'javac Main.java && java Main < input.txt';
    } else if (language === 'cpp') {
      scriptName = 'main.cpp';
      runCmd = 'g++ main.cpp -o main && ./main < input.txt';
    } else {
      throw new Error(`Unsupported execution language locally: "${language}"`);
    }

    // Isolate every concurrent run into a temporary folder INSIDE the single container
    const runId = Math.random().toString(36).substring(7);
    const workDir = `/tmp/run_${runId}`;

    // Creates dir -> un-bases files -> executes cleanly inside bounds -> terminates early if hung
    const dockerScript = `
      mkdir -p ${workDir} && cd ${workDir} && \
      echo ${base64Code} | base64 -d > ${scriptName} && \
      echo ${base64Stdin} | base64 -d > input.txt && \
      timeout 5 sh -c '${runCmd}'
    `.trim().replace(/\n/g, ' ');

    // Use `docker exec` against the persistent container defined in docker-compose.yml
    // Removed -i flag so the child_process stdin doesn't hang waiting for interactive input!
    const fullCommand = `docker exec clashcode-executor sh -c "${dockerScript}"`;

    try {
      const { stdout, stderr } = await execAsync(fullCommand, { 
        timeout: 10000,            // Give Node enough overhead to connect (10s map)
        maxBuffer: 1024 * 1024 * 2 // 2MB max output
      });

      // Cleanup isolation folder asynchronously 
      execAsync(`docker exec clashcode-executor rm -rf ${workDir}`).catch(()=>{});
      
      return {
        compile: { stderr: '', code: 0 },
        run: { stdout: stdout || '', stderr: stderr || '', code: 0, signal: null, status: null }
      };

    } catch (execErr) {
      execAsync(`docker exec clashcode-executor rm -rf ${workDir}`).catch(()=>{});

      const isTimeout = execErr.code === 124 || execErr.killed || execErr.signal === 'SIGTERM';
      let rawError = execErr.stderr || execErr.stdout || execErr.message || '';

      if (rawError.includes('No such container: clashcode-executor')) {
         rawError = 'CRITICAL: The clashcode-executor container is not running! Ensure you ran `docker-compose up -d --build`.';
      }

      return {
        compile: { 
          stderr: '', 
          code: 0 
        },
        run: { 
          stdout: execErr.stdout || '', 
          stderr: isTimeout ? 'Execution Time Limit Exceeded (Possible Infinite Loop)' : rawError,
          code: 1, 
          signal: isTimeout ? 'SIGKILL' : null, 
          status: isTimeout ? 'TO' : null 
        }
      };
    }

  } catch (err) {
    console.error('Docker Executor Error:', err);
    throw new Error('Docker Execution engine failed: ' + err.message);
  }
};