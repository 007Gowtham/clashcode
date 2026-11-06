package com.codearena.problem.comparator;

import java.util.ArrayList;
import java.util.List;

/**
 * Utility class for comparing judge actual output with expected output.
 * Rule: Trim trailing whitespace on each line and ignore trailing blank lines,
 * but otherwise exact match.
 */
public final class OutputComparator {

    private OutputComparator() {
        // Utility class
    }

    /**
     * Compares actual output with expected output according to contest rules.
     *
     * @param actual   the actual program output
     * @param expected the expected testcase output
     * @return true if outputs match after trimming trailing whitespace per line
     *         and ignoring trailing blank lines; false otherwise.
     */
    public static boolean compare(String actual, String expected) {
        if (actual == null && expected == null) {
            return true;
        }
        if (actual == null || expected == null) {
            return false;
        }

        List<String> actualLines = normalizeLines(actual);
        List<String> expectedLines = normalizeLines(expected);

        if (actualLines.size() != expectedLines.size()) {
            return false;
        }

        for (int i = 0; i < actualLines.size(); i++) {
            if (!actualLines.get(i).equals(expectedLines.get(i))) {
                return false;
            }
        }

        return true;
    }

    /**
     * Normalizes output by:
     * 1. Splitting into lines across CRLF or LF.
     * 2. Trimming trailing whitespace from each line (preserving leading and internal whitespace).
     * 3. Removing trailing empty/blank lines from the end of the line list.
     *
     * @param text input string
     * @return list of normalized lines
     */
    public static List<String> normalizeLines(String text) {
        if (text == null) {
            return List.of();
        }

        String[] rawLines = text.split("\\r?\\n", -1);
        List<String> lines = new ArrayList<>(rawLines.length);

        for (String raw : rawLines) {
            lines.add(trimTrailingWhitespace(raw));
        }

        // Remove trailing blank lines
        while (!lines.isEmpty() && lines.get(lines.size() - 1).isEmpty()) {
            lines.remove(lines.size() - 1);
        }

        return lines;
    }

    /**
     * Normalizes a text string using contest comparison rules and rejoins with \n.
     */
    public static String normalizeToString(String text) {
        return String.join("\n", normalizeLines(text));
    }

    private static String trimTrailingWhitespace(String s) {
        if (s == null || s.isEmpty()) {
            return "";
        }
        int len = s.length();
        while (len > 0 && Character.isWhitespace(s.charAt(len - 1))) {
            len--;
        }
        return s.substring(0, len);
    }
}

