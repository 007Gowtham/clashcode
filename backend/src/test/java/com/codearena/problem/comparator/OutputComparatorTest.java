package com.codearena.problem.comparator;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class OutputComparatorTest {

    @Test
    @DisplayName("Exact match identical strings return true")
    void testExactMatch() {
        String output = "1 2 3\n4 5 6";
        assertThat(OutputComparator.compare(output, output)).isTrue();
    }

    @Test
    @DisplayName("Trailing whitespace on each line is trimmed and matches")
    void testTrailingWhitespaceTrimmed() {
        String actual = "1 2 3   \n4 5 6 \t \t";
        String expected = "1 2 3\n4 5 6";
        assertThat(OutputComparator.compare(actual, expected)).isTrue();
    }

    @Test
    @DisplayName("Leading whitespace is preserved and causes mismatch if different")
    void testLeadingWhitespacePreserved() {
        String actual = "  1 2 3\n4 5 6";
        String expected = "1 2 3\n4 5 6";
        assertThat(OutputComparator.compare(actual, expected)).isFalse();
    }

    @Test
    @DisplayName("Internal whitespace is preserved and causes mismatch if different")
    void testInternalWhitespacePreserved() {
        String actual = "1   2 3\n4 5 6";
        String expected = "1 2 3\n4 5 6";
        assertThat(OutputComparator.compare(actual, expected)).isFalse();
    }

    @Test
    @DisplayName("Trailing blank lines are ignored")
    void testTrailingBlankLinesIgnored() {
        String actual = "1 2 3\n\n\n\n";
        String expected = "1 2 3\n";
        assertThat(OutputComparator.compare(actual, expected)).isTrue();

        String actual2 = "result";
        String expected2 = "result\n\n";
        assertThat(OutputComparator.compare(actual2, expected2)).isTrue();
    }

    @Test
    @DisplayName("Intermediate blank lines are significant and preserved")
    void testIntermediateBlankLinesPreserved() {
        String actual = "line 1\n\nline 2";
        String expected = "line 1\nline 2";
        assertThat(OutputComparator.compare(actual, expected)).isFalse();

        String actualMatching = "line 1\n\nline 2\n\n";
        String expectedMatching = "line 1\n\nline 2";
        assertThat(OutputComparator.compare(actualMatching, expectedMatching)).isTrue();
    }

    @Test
    @DisplayName("CRLF (Windows) and LF (Unix) line endings are normalized and match")
    void testCrlfAndLfNormalization() {
        String actual = "line 1\r\nline 2\r\n";
        String expected = "line 1\nline 2";
        assertThat(OutputComparator.compare(actual, expected)).isTrue();
    }

    @Test
    @DisplayName("Empty or blank strings compare correctly")
    void testEmptyOutputs() {
        assertThat(OutputComparator.compare("", "")).isTrue();
        assertThat(OutputComparator.compare("   \n\n", "")).isTrue();
        assertThat(OutputComparator.compare(null, null)).isTrue();
        assertThat(OutputComparator.compare(null, "")).isFalse();
        assertThat(OutputComparator.compare("abc", null)).isFalse();
    }
}

