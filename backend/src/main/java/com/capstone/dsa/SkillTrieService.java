package com.capstone.dsa;

import com.capstone.model.Skill;
import com.capstone.repository.SkillRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Spring-managed bean that wraps SkillTrie and pre-populates it from the DB.
 *
 * The trie is built ONCE at startup from the skills table.
 * Queries are O(L) instead of O(N × L) database LIKE queries.
 *
 * Usage:
 *   @Autowired SkillTrieService trieService;
 *   List<SkillTrie.SkillResult> suggestions = trieService.autocomplete("pyth", 5);
 */
@Component
public class SkillTrieService {

    private static final Logger log = LoggerFactory.getLogger(SkillTrieService.class);

    private final SkillRepository skillRepository;
    private final SkillTrie       trie = new SkillTrie();

    @Autowired
    public SkillTrieService(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    /**
     * Populate the trie from the database after Spring context is ready.
     * Called once — O(N × L) total where N = skill count, L = avg name length.
     */
    @PostConstruct
    public void buildTrie() {
        List<Skill> skills = skillRepository.findAll();
        for (Skill skill : skills) {
            trie.insert(
                    skill.getSkillName(),
                    skill.getCategory(),
                    skill.getId()
            );
        }
        log.info("SkillTrie built with {} skills", trie.size());
    }

    /**
     * Autocomplete — O(L + K) lookup.
     *
     * @param prefix case-insensitive prefix string (e.g. "pyth")
     * @param limit  maximum number of results to return
     * @return List of matching SkillResult records (id, name, category)
     */
    public List<SkillTrie.SkillResult> autocomplete(String prefix, int limit) {
        if (prefix == null || prefix.isBlank()) {
            return List.of();
        }
        return trie.autocomplete(prefix.trim(), limit);
    }

    /**
     * Exact lookup — O(L).
     */
    public boolean exists(String skillName) {
        return trie.search(skillName);
    }

    public int size() {
        return trie.size();
    }
}
