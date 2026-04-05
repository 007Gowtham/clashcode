import { runCode } from './src/utils/piston.js';
import { normalizeInput } from './src/utils/normalize.js';
import dotenv from 'dotenv';
dotenv.config();

const code = `
import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();
        System.out.println(s.length());
    }
}
`;

async function test() {
  try {
    const raw = normalizeInput('s = "()"');
    console.log(`Sending raw stdin: [${raw}]`);
    const res = await runCode('java', code, raw);
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
