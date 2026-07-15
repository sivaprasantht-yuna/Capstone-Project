package com.capstone.controller;

import com.capstone.dsa.SkillTrieService;
import com.capstone.dsa.SkillTrie;
import com.capstone.model.Skill;
import com.capstone.repository.SkillRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Skill catalog REST endpoints.
 *
 * GET /api/v1/skills/autocomplete?prefix=py&limit=5
 *   → Uses SkillTrie (Trie DSA) for O(L) prefix matching
 *
 * GET /api/v1/skills
 *   → Full skill catalog listing (used on profile page)
 *
 * POST /api/v1/skills   (Admin only)
 *   → Add a new skill and insert it into the live Trie without restart
 */
@RestController
@RequestMapping("/api/v1/skills")
@Tag(name = "Skill Catalog", description = "Skill catalog with Trie-powered autocomplete (DSA)")
public class SkillController {

    private final SkillRepository    skillRepository;
    private final SkillTrieService   trieService;

    @Autowired
    public SkillController(SkillRepository skillRepository, SkillTrieService trieService) {
        this.skillRepository = skillRepository;
        this.trieService     = trieService;
    }

    // ── Autocomplete ─────────────────────────────────────────────────────────

    @GetMapping("/autocomplete")
    @Operation(
        summary     = "Autocomplete skill names",
        description = "O(L) Trie lookup — returns skills matching the given prefix. "
                    + "DSA: Trie with DFS-based word collection."
    )
    public ResponseEntity<List<SkillTrie.SkillResult>> autocomplete(
            @RequestParam String prefix,
            @RequestParam(defaultValue = "8") int limit
    ) {
        return ResponseEntity.ok(trieService.autocomplete(prefix, limit));
    }

    // ── Full catalog ──────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "List all skills in the catalog")
    public ResponseEntity<List<Skill>> getAll() {
        return ResponseEntity.ok(skillRepository.findAll());
    }

    // ── Trie stats (useful for Admin / viva demo) ─────────────────────────────

    @GetMapping("/trie-info")
    @Operation(
        summary     = "Trie statistics",
        description = "Returns size of the in-memory Trie (number of indexed skills). "
                    + "Demonstrates the DSA component is live."
    )
    public ResponseEntity<?> trieInfo() {
        return ResponseEntity.ok(java.util.Map.of(
            "indexed_skills", trieService.size(),
            "structure",      "Trie (Prefix Tree)",
            "lookup_complexity", "O(L) where L = prefix length",
            "description",    "Built from DB at startup via @PostConstruct"
        ));
    }
}
