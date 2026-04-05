import { runCode } from './src/utils/piston.js';
import dotenv from 'dotenv';
dotenv.config();

const code = `
import java.util.*;
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}
`;

async function test() {
  try {
    const res = await runCode('java', code, '');
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
