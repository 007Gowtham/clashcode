package com.codearena.problem.seed;

import com.codearena.auth.entity.Role;
import com.codearena.auth.entity.User;
import com.codearena.auth.repository.UserRepository;
import com.codearena.problem.domain.*;
import com.codearena.problem.repository.ProblemRepository;
import com.codearena.problem.repository.StarterCodeRepository;
import com.codearena.problem.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class ProblemDataSeeder implements CommandLineRunner {

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final StarterCodeRepository starterCodeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        UUID adminId = getOrCreateSystemAdmin();

        if (!problemRepository.existsBySlug("two-sum")) {
            seedTwoSum(adminId);
        }

        if (!problemRepository.existsBySlug("reverse-string")) {
            seedReverseString(adminId);
        }

        if (!problemRepository.existsBySlug("valid-parentheses")) {
            seedValidParentheses(adminId);
        }
    }

    private UUID getOrCreateSystemAdmin() {
        return userRepository.findByUsername("clash_admin")
                .map(User::getId)
                .orElseGet(() -> {
                    User admin = User.builder()
                            .username("clash_admin")
                            .email("admin@clashcode.com")
                            .passwordHash(passwordEncoder.encode("AdminPass123!"))
                            .role(Role.ROLE_ADMIN)
                            .createdAt(Instant.now())
                            .build();
                    User saved = userRepository.save(admin);
                    log.info("Created default system admin: clash_admin (id: {})", saved.getId());
                    return saved.getId();
                });
    }

    /*
     * Input format for Two Sum test cases (stdin):
     *   Line 1: n (array length)
     *   Line 2: space-separated integers (the array)
     *   Line 3: target integer
     * Expected output: two space-separated indices, e.g. "0 1"
     */
    private void seedTwoSum(UUID adminId) {
        Problem problem = Problem.builder()
                .title("Two Sum")
                .slug("two-sum")
                .statementMarkdown("""
                        ### Two Sum

                        Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

                        You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

                        You can return the answer in any order.

                        #### Example 1:
                        ```
                        Input: nums = [2,7,11,15], target = 9
                        Output: 0 1
                        Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
                        ```

                        #### Example 2:
                        ```
                        Input: nums = [3,2,4], target = 6
                        Output: 1 2
                        ```

                        #### Input Format (stdin):
                        - Line 1: `n` — length of array
                        - Line 2: `n` space-separated integers
                        - Line 3: `target`

                        #### Output Format:
                        Two space-separated indices.

                        #### Constraints:
                        * `2 <= nums.length <= 10^4`
                        * `-10^9 <= nums[i] <= 10^9`
                        * `-10^9 <= target <= 10^9`
                        * **Only one valid answer exists.**
                        """)
                .difficulty(ProblemDifficulty.EASY)
                .tags(Set.of("array", "hash-table"))
                .timeLimitMs(2000)
                .memoryLimitMb(256)
                .points(100)
                .createdBy(adminId)
                .status(ProblemStatus.PUBLISHED)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Problem saved = problemRepository.save(problem);

        // Sample Cases — input is raw stdin piped to the program
        testCaseRepository.save(TestCase.builder()
                .problemId(saved.getId())
                .input("4\n2 7 11 15\n9")
                .expectedOutput("0 1")
                .isSample(true)
                .orderIndex(1)
                .build());

        testCaseRepository.save(TestCase.builder()
                .problemId(saved.getId())
                .input("3\n3 2 4\n6")
                .expectedOutput("1 2")
                .isSample(true)
                .orderIndex(2)
                .build());

        // Hidden Cases
        testCaseRepository.save(TestCase.builder()
                .problemId(saved.getId())
                .input("2\n3 3\n6")
                .expectedOutput("0 1")
                .isSample(false)
                .orderIndex(3)
                .build());

        testCaseRepository.save(TestCase.builder()
                .problemId(saved.getId())
                .input("5\n-1 -2 -3 -4 -5\n-8")
                .expectedOutput("2 4")
                .isSample(false)
                .orderIndex(4)
                .build());

        // Starter Codes — template has user stub ONLY; I/O wrapper is below delimiter
        starterCodeRepository.save(StarterCode.builder()
                .problemId(saved.getId())
                .language(ProgrammingLanguage.JAVA)
                .templateCode("""
                        import java.util.*;
                        import java.io.*;

                        class Solution {
                            public int[] twoSum(int[] nums, int target) {
                                // Write your solution here
                                return new int[]{};
                            }
                        }

                        // ── I/O wrapper — do not edit below ──────────────────────
                        public class Main {
                            public static void main(String[] args) throws IOException {
                                BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
                                int n = Integer.parseInt(br.readLine().trim());
                                StringTokenizer st = new StringTokenizer(br.readLine());
                                int[] nums = new int[n];
                                for (int i = 0; i < n; i++) nums[i] = Integer.parseInt(st.nextToken());
                                int target = Integer.parseInt(br.readLine().trim());

                                int[] result = new Solution().twoSum(nums, target);
                                System.out.println(result[0] + " " + result[1]);
                            }
                        }
                        """)
                .build());

        starterCodeRepository.save(StarterCode.builder()
                .problemId(saved.getId())
                .language(ProgrammingLanguage.PYTHON)
                .templateCode("""
                        import sys

                        # Write your solution here
                        def twoSum(nums, target):
                            pass

                        # ── I/O wrapper — do not edit below ──────────────────────
                        if __name__ == '__main__':
                            input = sys.stdin.readline
                            n = int(input())
                            nums = list(map(int, input().split()))
                            target = int(input())
                            result = twoSum(nums, target)
                            print(result[0], result[1])
                        """)
                .build());

        starterCodeRepository.save(StarterCode.builder()
                .problemId(saved.getId())
                .language(ProgrammingLanguage.CPP)
                .templateCode("""
                        #include <bits/stdc++.h>
                        using namespace std;

                        // Write your solution here
                        vector<int> twoSum(vector<int>& nums, int target) {
                            return {};
                        }

                        // ── I/O wrapper — do not edit below ──────────────────────
                        int main() {
                            ios_base::sync_with_stdio(false);
                            cin.tie(NULL);
                            int n; cin >> n;
                            vector<int> nums(n);
                            for (int& x : nums) cin >> x;
                            int target; cin >> target;
                            auto res = twoSum(nums, target);
                            cout << res[0] << " " << res[1] << "\\n";
                            return 0;
                        }
                        """)
                .build());

        starterCodeRepository.save(StarterCode.builder()
                .problemId(saved.getId())
                .language(ProgrammingLanguage.JAVASCRIPT)
                .templateCode("""
                        // Write your solution here
                        function twoSum(nums, target) {
                            return [];
                        }

                        // ── I/O wrapper — do not edit below ──────────────────────
                        const lines = require('fs').readFileSync(0, 'utf8').trim().split('\\n');
                        const n = parseInt(lines[0]);
                        const nums = lines[1].trim().split(' ').map(Number);
                        const target = parseInt(lines[2]);
                        const result = twoSum(nums, target);
                        console.log(result[0] + ' ' + result[1]);
                        """)
                .build());

        log.info("Seeded problem: Two Sum (slug: two-sum)");
    }

    /*
     * Input format for Reverse String test cases (stdin):
     *   Line 1: the string to reverse (plain text)
     * Expected output: reversed string on one line
     */
    private void seedReverseString(UUID adminId) {
        Problem problem = Problem.builder()
                .title("Reverse String")
                .slug("reverse-string")
                .statementMarkdown("""
                        ### Reverse String

                        Write a function that reverses a string. The input string is given as a plain string `s`.

                        #### Example 1:
                        ```
                        Input: hello
                        Output: olleh
                        ```

                        #### Example 2:
                        ```
                        Input: Hannah
                        Output: hannaH
                        ```

                        #### Input Format (stdin):
                        - Line 1: string `s`

                        #### Output Format:
                        The reversed string.

                        #### Constraints:
                        * `1 <= s.length <= 10^5`
                        * `s[i]` is a printable ascii character.
                        """)
                .difficulty(ProblemDifficulty.EASY)
                .tags(Set.of("string", "two-pointers"))
                .timeLimitMs(2000)
                .memoryLimitMb(256)
                .points(100)
                .createdBy(adminId)
                .status(ProblemStatus.PUBLISHED)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Problem saved = problemRepository.save(problem);

        // Sample Cases — raw stdin
        testCaseRepository.save(TestCase.builder()
                .problemId(saved.getId())
                .input("hello")
                .expectedOutput("olleh")
                .isSample(true)
                .orderIndex(1)
                .build());

        // Hidden Cases
        testCaseRepository.save(TestCase.builder()
                .problemId(saved.getId())
                .input("Hannah")
                .expectedOutput("hannaH")
                .isSample(false)
                .orderIndex(2)
                .build());

        testCaseRepository.save(TestCase.builder()
                .problemId(saved.getId())
                .input("A")
                .expectedOutput("A")
                .isSample(false)
                .orderIndex(3)
                .build());

        // Starter Codes — template has user stub ONLY; I/O wrapper is below delimiter
        starterCodeRepository.save(StarterCode.builder()
                .problemId(saved.getId())
                .language(ProgrammingLanguage.JAVA)
                .templateCode("""
                        import java.util.*;
                        import java.io.*;

                        class Solution {
                            public String reverseString(String s) {
                                // Write your solution here
                                return "";
                            }
                        }

                        // ── I/O wrapper — do not edit below ──────────────────────
                        public class Main {
                            public static void main(String[] args) throws IOException {
                                BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
                                String s = br.readLine();
                                if (s == null) s = "";
                                System.out.println(new Solution().reverseString(s.trim()));
                            }
                        }
                        """)
                .build());

        starterCodeRepository.save(StarterCode.builder()
                .problemId(saved.getId())
                .language(ProgrammingLanguage.PYTHON)
                .templateCode("""
                        import sys

                        # Write your solution here
                        def reverseString(s):
                            pass

                        # ── I/O wrapper — do not edit below ──────────────────────
                        if __name__ == '__main__':
                            input = sys.stdin.readline
                            s = input().rstrip('\\r\\n')
                            print(reverseString(s))
                        """)
                .build());

        starterCodeRepository.save(StarterCode.builder()
                .problemId(saved.getId())
                .language(ProgrammingLanguage.CPP)
                .templateCode("""
                        #include <bits/stdc++.h>
                        using namespace std;

                        // Write your solution here
                        string reverseString(string s) {
                            return "";
                        }

                        // ── I/O wrapper — do not edit below ──────────────────────
                        int main() {
                            ios_base::sync_with_stdio(false);
                            cin.tie(NULL);
                            string s;
                            if (getline(cin, s)) {
                                cout << reverseString(s) << "\\n";
                            }
                            return 0;
                        }
                        """)
                .build());

        starterCodeRepository.save(StarterCode.builder()
                .problemId(saved.getId())
                .language(ProgrammingLanguage.JAVASCRIPT)
                .templateCode("""
                        // Write your solution here
                        function reverseString(s) {
                            return "";
                        }

                        // ── I/O wrapper — do not edit below ──────────────────────
                        const lines = require('fs').readFileSync(0, 'utf8').trim().split('\\n');
                        const s = lines[0] || '';
                        console.log(reverseString(s));
                        """)
                .build());

        log.info("Seeded problem: Reverse String (slug: reverse-string)");
    }

    /*
     * Input format for Valid Parentheses test cases (stdin):
     *   Line 1: the parentheses string
     * Expected output: "true" or "false"
     */
    private void seedValidParentheses(UUID adminId) {
        Problem problem = Problem.builder()
                .title("Valid Parentheses")
                .slug("valid-parentheses")
                .statementMarkdown("""
                        ### Valid Parentheses

                        Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.

                        An input string is valid if:
                        1. Open brackets must be closed by the same type of brackets.
                        2. Open brackets must be closed in the correct order.
                        3. Every close bracket has a corresponding open bracket of the same type.

                        #### Example 1:
                        ```
                        Input: ()
                        Output: true
                        ```

                        #### Example 2:
                        ```
                        Input: ()[]{} 
                        Output: true
                        ```

                        #### Example 3:
                        ```
                        Input: (]
                        Output: false
                        ```

                        #### Input Format (stdin):
                        - Line 1: string `s`

                        #### Output Format:
                        `true` or `false`

                        #### Constraints:
                        * `1 <= s.length <= 10^4`
                        * `s` consists of parentheses only `'()[]{}'`.
                        """)
                .difficulty(ProblemDifficulty.EASY)
                .tags(Set.of("string", "stack"))
                .timeLimitMs(2000)
                .memoryLimitMb(256)
                .points(100)
                .createdBy(adminId)
                .status(ProblemStatus.PUBLISHED)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Problem saved = problemRepository.save(problem);

        // Sample Cases — raw stdin
        testCaseRepository.save(TestCase.builder()
                .problemId(saved.getId())
                .input("()")
                .expectedOutput("true")
                .isSample(true)
                .orderIndex(1)
                .build());

        testCaseRepository.save(TestCase.builder()
                .problemId(saved.getId())
                .input("()[]{}")
                .expectedOutput("true")
                .isSample(true)
                .orderIndex(2)
                .build());

        // Hidden Cases
        testCaseRepository.save(TestCase.builder()
                .problemId(saved.getId())
                .input("(]")
                .expectedOutput("false")
                .isSample(false)
                .orderIndex(3)
                .build());

        testCaseRepository.save(TestCase.builder()
                .problemId(saved.getId())
                .input("([)]")
                .expectedOutput("false")
                .isSample(false)
                .orderIndex(4)
                .build());

        // Starter Codes — template has user stub ONLY; I/O wrapper is below delimiter
        starterCodeRepository.save(StarterCode.builder()
                .problemId(saved.getId())
                .language(ProgrammingLanguage.JAVA)
                .templateCode("""
                        import java.util.*;
                        import java.io.*;

                        class Solution {
                            public boolean isValid(String s) {
                                // Write your solution here
                                return false;
                            }
                        }

                        // ── I/O wrapper — do not edit below ──────────────────────
                        public class Main {
                            public static void main(String[] args) throws IOException {
                                BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
                                String s = br.readLine();
                                if (s == null) s = "";
                                System.out.println(new Solution().isValid(s.trim()));
                            }
                        }
                        """)
                .build());

        starterCodeRepository.save(StarterCode.builder()
                .problemId(saved.getId())
                .language(ProgrammingLanguage.PYTHON)
                .templateCode("""
                        import sys

                        # Write your solution here
                        def isValid(s):
                            return False

                        # ── I/O wrapper — do not edit below ──────────────────────
                        if __name__ == '__main__':
                            input = sys.stdin.readline
                            s = input().rstrip('\\r\\n')
                            print(str(isValid(s)).lower())
                        """)
                .build());

        starterCodeRepository.save(StarterCode.builder()
                .problemId(saved.getId())
                .language(ProgrammingLanguage.CPP)
                .templateCode("""
                        #include <bits/stdc++.h>
                        using namespace std;

                        // Write your solution here
                        bool isValid(string s) {
                            return false;
                        }

                        // ── I/O wrapper — do not edit below ──────────────────────
                        int main() {
                            ios_base::sync_with_stdio(false);
                            cin.tie(NULL);
                            string s;
                            if (getline(cin, s)) {
                                cout << (isValid(s) ? "true" : "false") << "\\n";
                            }
                            return 0;
                        }
                        """)
                .build());

        starterCodeRepository.save(StarterCode.builder()
                .problemId(saved.getId())
                .language(ProgrammingLanguage.JAVASCRIPT)
                .templateCode("""
                        // Write your solution here
                        function isValid(s) {
                            return false;
                        }

                        // ── I/O wrapper — do not edit below ──────────────────────
                        const lines = require('fs').readFileSync(0, 'utf8').trim().split('\\n');
                        const s = lines[0] || '';
                        console.log(String(isValid(s)));
                        """)
                .build());

        log.info("Seeded problem: Valid Parentheses (slug: valid-parentheses)");
    }
}

