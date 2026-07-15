package com.capstone.dsa;

import java.util.Comparator;
import java.util.List;
import java.util.ArrayList;

/**
 * Generic Merge Sort implementation for multi-field leaderboard ranking.
 *
 * <pre>
 * WHY MERGE SORT?
 *   - Guaranteed O(N log N) — no worst-case degradation (unlike QuickSort)
 *   - Stable sort — teams with equal scores maintain their original order
 *   - Well-suited for Java generics with a custom Comparator
 *
 * APPLIED TO:
 *   1. Leaderboard: sort teams by (totalScore DESC, teamName ASC)
 *   2. Mentorship requests: sort by (matchScore DESC, requestedAt ASC)
 *   3. Project ideas: sort by (upvoteCount DESC, createdAt DESC)
 * </pre>
 *
 * Time:  O(N log N) — always
 * Space: O(N)       — temporary arrays in merge step
 */
public class MergeSort {

    // Private constructor — utility class, not instantiable
    private MergeSort() {}

    /**
     * Sort a list using the provided Comparator.
     * Returns a new sorted list; original list is not mutated.
     *
     * @param list       Input list
     * @param comparator Comparison function defining sort order
     * @param <T>        Element type
     * @return New sorted list
     */
    public static <T> List<T> sort(List<T> list, Comparator<T> comparator) {
        if (list == null || list.size() <= 1) {
            return new ArrayList<>(list == null ? List.of() : list);
        }
        return mergeSort(new ArrayList<>(list), comparator);
    }

    // ── Recursive helpers ─────────────────────────────────────────────────────

    private static <T> List<T> mergeSort(List<T> list, Comparator<T> cmp) {
        if (list.size() <= 1) return list;                  // Base case

        int mid = list.size() / 2;
        List<T> left  = mergeSort(new ArrayList<>(list.subList(0, mid)),        cmp);
        List<T> right = mergeSort(new ArrayList<>(list.subList(mid, list.size())), cmp);

        return merge(left, right, cmp);
    }

    /**
     * Core merge step — combines two sorted halves into one sorted list.
     * Time: O(N) where N = left.size() + right.size()
     */
    private static <T> List<T> merge(List<T> left, List<T> right, Comparator<T> cmp) {
        List<T> result = new ArrayList<>(left.size() + right.size());
        int i = 0, j = 0;

        while (i < left.size() && j < right.size()) {
            // cmp.compare returns ≤ 0 when left[i] should come before right[j]
            if (cmp.compare(left.get(i), right.get(j)) <= 0) {
                result.add(left.get(i++));
            } else {
                result.add(right.get(j++));
            }
        }

        // Append any remaining elements (at most one loop will execute)
        while (i < left.size())  result.add(left.get(i++));
        while (j < right.size()) result.add(right.get(j++));

        return result;
    }

    // ── Pre-built comparators for the application domain ─────────────────────

    /**
     * Leaderboard comparator:
     *   1. totalScore DESC (higher = better rank)
     *   2. teamName    ASC (alphabetical tiebreaker)
     */
    public static <T> Comparator<T> leaderboardComparator(
            java.util.function.ToIntFunction<T>    scoreExtractor,
            java.util.function.Function<T, String> nameExtractor
    ) {
        return Comparator
                .comparingInt(scoreExtractor).reversed()        // DESC score
                .thenComparing(nameExtractor);                  // ASC name
    }
}
