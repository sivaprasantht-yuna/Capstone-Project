package com.capstone.dsa;

/**
 * Trie (Prefix Tree) for O(L) skill name autocomplete.
 *
 * <pre>
 * WHY A TRIE?
 *   Naïve search: O(N × L) — scan all skill names and compare each character
 *   Trie search:  O(L)     — walk down the tree character by character
 *   where N = number of skills, L = length of query prefix
 *
 * For skill autocomplete in the frontend search box, this is critical:
 *   - 25 skills now → 250+ skills in production
 *   - Trie gives instant O(L) prefix match regardless of skill catalog size
 *
 * STRUCTURE:
 *   - Each TrieNode stores a char-to-child map and a boolean isEndOfWord flag
 *   - Optionally stores skill metadata (category, id) at terminal nodes
 *   - Space: O(ALPHABET × N × L) worst case, but most nodes are shared
 * </pre>
 *
 * Time complexities:
 *   insert()  → O(L)
 *   search()  → O(L)
 *   startsWith() → O(L)
 *   autocomplete() → O(L + K×DEPTH) where K = number of matches
 */
public class SkillTrie {

    // ── Inner node class ─────────────────────────────────────────────────────

    private static class TrieNode {
        private final java.util.Map<Character, TrieNode> children = new java.util.HashMap<>();
        private boolean  isEndOfWord = false;
        private String   skillName   = null;   // Full name stored at terminal node
        private String   category    = null;   // e.g. "AI/ML", "Hardware"
        private Long     skillId     = null;

        TrieNode() {}
    }

    // ── Fields ───────────────────────────────────────────────────────────────

    private final TrieNode root = new TrieNode();
    private int size = 0;

    // ── Core operations ───────────────────────────────────────────────────────

    /**
     * Insert a skill name into the trie.
     * Case-insensitive: stored as lowercase for uniform matching.
     * Time: O(L) where L = skill name length
     */
    public void insert(String skillName, String category, Long skillId) {
        TrieNode current = root;
        String lower = skillName.toLowerCase();

        for (char ch : lower.toCharArray()) {
            current = current.children.computeIfAbsent(ch, k -> new TrieNode());
        }

        if (!current.isEndOfWord) {
            current.isEndOfWord = true;
            current.skillName   = skillName;
            current.category    = category;
            current.skillId     = skillId;
            size++;
        }
    }

    /**
     * Exact search — returns true if the skill exists in the trie.
     * Time: O(L)
     */
    public boolean search(String skillName) {
        TrieNode node = findNode(skillName.toLowerCase());
        return node != null && node.isEndOfWord;
    }

    /**
     * Prefix check — returns true if any skill starts with the given prefix.
     * Time: O(L)
     */
    public boolean startsWith(String prefix) {
        return findNode(prefix.toLowerCase()) != null;
    }

    /**
     * Autocomplete — returns all skills matching the given prefix.
     * Performs a DFS from the prefix node to collect all terminal nodes.
     *
     * Time: O(L + K × DEPTH) where:
     *   L = prefix length
     *   K = number of matching results
     *   DEPTH = average remaining depth after prefix node
     */
    public java.util.List<SkillResult> autocomplete(String prefix, int limit) {
        java.util.List<SkillResult> results = new java.util.ArrayList<>();
        TrieNode prefixNode = findNode(prefix.toLowerCase());
        if (prefixNode == null) {
            return results;  // No skills with this prefix
        }
        // DFS to collect all skills under this prefix node
        collectWords(prefixNode, results, limit);
        return results;
    }

    public int size() {
        return size;
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private TrieNode findNode(String lower) {
        TrieNode current = root;
        for (char ch : lower.toCharArray()) {
            current = current.children.get(ch);
            if (current == null) return null;
        }
        return current;
    }

    /**
     * Recursive DFS to collect all words under a given node.
     */
    private void collectWords(TrieNode node, java.util.List<SkillResult> results, int limit) {
        if (results.size() >= limit) return;

        if (node.isEndOfWord) {
            results.add(new SkillResult(node.skillId, node.skillName, node.category));
        }
        for (TrieNode child : node.children.values()) {
            if (results.size() >= limit) return;
            collectWords(child, results, limit);
        }
    }

    // ── Result record ─────────────────────────────────────────────────────────

    public record SkillResult(Long id, String name, String category) {}
}
