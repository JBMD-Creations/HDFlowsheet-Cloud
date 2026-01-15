import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const SnippetContext = createContext();

export const useSnippets = () => {
  const context = useContext(SnippetContext);
  if (!context) {
    throw new Error('useSnippets must be used within a SnippetProvider');
  }
  return context;
};

const DEFAULT_SNIPPETS = [
  {
    id: 1,
    name: 'Default',
    order: 0,
    sections: [
      {
        id: 1,
        name: 'Weight & UF Management',
        icon: '⚖️',
        order: 0,
        snippets: [
          { id: 101, text: 'Pt denies any pains / SOB. No other voiced concerns.', tags: ['assessment', 'pre-treatment'], order: 0 }
        ]
      },
      {
        id: 2,
        name: 'Pre Dialysis',
        icon: '🏥',
        order: 1,
        snippets: [
          { id: 201, text: 'Weight and goal reviewed and verified with pt.', tags: ['weight', 'pre-treatment'], order: 0 },
          { id: 202, text: 'Pt denies any pains / SOB. No other voiced concerns.', tags: ['assessment'], order: 1 },
          { id: 203, text: '5 mg Midodrine given for BP support.', tags: ['medication', 'bp-support'], order: 2 },
          { id: 204, text: 'T to 36.5 for BP support.', tags: ['temperature', 'bp-support'], order: 3 },
          { id: 205, text: 'T to 36.0 for BP support.', tags: ['temperature', 'bp-support'], order: 4 }
        ]
      },
      {
        id: 3,
        name: 'Treatment Initiated',
        icon: '💉',
        order: 2,
        snippets: [
          { id: 301, text: 'Treatment initiated per orders. BFR [BFR], UF goal [UF Goal].', tags: ['initiation', 'orders'], order: 0 },
          { id: 302, text: 'Pt tolerated treatment initiation without complaint.', tags: ['initiation', 'stable'], order: 1 },
          { id: 303, text: 'Access cannulated without difficulty.', tags: ['access', 'initiation'], order: 2 },
          { id: 304, text: 'Good arterial/venous flow noted.', tags: ['access', 'flow'], order: 3 }
        ]
      },
      {
        id: 4,
        name: 'During Treatment',
        icon: '⏱️',
        order: 3,
        snippets: [
          { id: 401, text: 'Pt experiencing cramping.', tags: ['cramping', 'complication'], order: 0 },
          { id: 402, text: 'UF to minimum.', tags: ['uf-adjustment', 'intervention'], order: 1 }
        ]
      },
      {
        id: 5,
        name: 'Hypertension Management',
        icon: '🔴',
        order: 4,
        snippets: [
          { id: 501, text: 'Pt BP elevated.', tags: ['hypertension', 'bp'], order: 0 },
          { id: 502, text: 'Pt denies any chest pain, SOB, dizziness or headache.', tags: ['assessment', 'hypertension'], order: 1 },
          { id: 503, text: 'Pt reports taking his BP meds before tx.', tags: ['medication', 'hypertension'], order: 2 },
          { id: 504, text: '0.1 mg clonidine given for BP support.', tags: ['medication', 'hypertension'], order: 3 },
          { id: 505, text: 'BP stabilized after intervention.', tags: ['stable', 'hypertension'], order: 4 },
          { id: 506, text: 'Will continue to monitor BP closely.', tags: ['monitoring', 'hypertension'], order: 5 },
          { id: 507, text: 'T to 37 for BP support.', tags: ['temperature', 'hypertension'], order: 6 }
        ]
      },
      {
        id: 6,
        name: 'Hypotension Management',
        icon: '🔵',
        order: 5,
        snippets: [
          { id: 601, text: 'Pt experiencing hypotension during treatment.', tags: ['hypotension', 'complication'], order: 0 },
          { id: 602, text: 'Pt BP low side.', tags: ['hypotension', 'bp'], order: 1 },
          { id: 603, text: 'Pt experienced > 20 pt SBP drop.', tags: ['hypotension', 'bp-drop'], order: 2 },
          { id: 604, text: 'Pt experiencing side effects d/t hypotension - dizzy / light headedness.', tags: ['hypotension', 'symptoms'], order: 3 },
          { id: 605, text: 'Pt denies any s/s of hypotension such as light headedness, chest pain or SOB.', tags: ['hypotension', 'assessment'], order: 4 },
          { id: 606, text: '5 mg Midodrine given for BP support.', tags: ['medication', 'bp-support'], order: 5 },
          { id: 607, text: '100mL NS bolus given for BP support.', tags: ['fluid', 'bp-support'], order: 6 },
          { id: 608, text: 'BP stabilized, treatment continued.', tags: ['stable', 'hypotension'], order: 7 },
          { id: 609, text: 'UF to min for BP support.', tags: ['uf-adjustment', 'bp-support'], order: 8 },
          { id: 610, text: 'T to 36.5 for BP support.', tags: ['temperature', 'bp-support'], order: 9 },
          { id: 611, text: 'T already at 36.0.', tags: ['temperature', 'hypotension'], order: 10 },
          { id: 612, text: 'MAP remains > 70.', tags: ['bp', 'monitoring'], order: 11 }
        ]
      },
      {
        id: 7,
        name: 'No Changes / Stable',
        icon: '✅',
        order: 6,
        snippets: [
          { id: 701, text: 'Pt stable throughout treatment.', tags: ['stable'], order: 0 },
          { id: 702, text: 'No complaints voiced.', tags: ['stable', 'assessment'], order: 1 },
          { id: 703, text: 'Tolerating treatment well without intervention.', tags: ['stable'], order: 2 },
          { id: 704, text: 'VS within normal limits.', tags: ['stable', 'vitals'], order: 3 },
          { id: 705, text: 'No changes / Stable.', tags: ['stable'], order: 4 },
          { id: 706, text: 'Pt resting comfortably in chair watching TV.', tags: ['stable', 'comfort'], order: 5 },
          { id: 707, text: 'Pt resting comfortably in chair playing with phone.', tags: ['stable', 'comfort'], order: 6 },
          { id: 708, text: 'Pt sleeping comfortably with head back and legs elevated. Chest rising and falling appropriately. No signs of distress.', tags: ['stable', 'sleeping'], order: 7 }
        ]
      },
      {
        id: 8,
        name: 'Access & Lines',
        icon: '🩸',
        order: 7,
        snippets: [
          { id: 801, text: 'Fistula assessment: good thrill and bruit noted.', tags: ['access', 'fistula'], order: 0 },
          { id: 802, text: 'Graft assessment: patent, no signs of infection.', tags: ['access', 'graft'], order: 1 },
          { id: 803, text: 'Catheter site clean, dry, intact.', tags: ['access', 'catheter'], order: 2 },
          { id: 804, text: 'Dressing changed per protocol.', tags: ['access', 'dressing'], order: 3 },
          { id: 805, text: 'No signs of bleeding or hematoma at access site.', tags: ['access', 'assessment'], order: 4 },
          { id: 806, text: 'Good hemostasis achieved post-treatment.', tags: ['access', 'post-treatment'], order: 5 }
        ]
      },
      {
        id: 9,
        name: 'Fluid Management',
        icon: '💧',
        order: 8,
        snippets: [
          { id: 901, text: 'IDWG within acceptable range.', tags: ['fluid', 'weight'], order: 0 },
          { id: 902, text: 'Significant IDWG noted, fluid restriction education reinforced.', tags: ['fluid', 'education'], order: 1 },
          { id: 903, text: 'UF goal met without difficulty.', tags: ['fluid', 'uf'], order: 2 },
          { id: 904, text: 'Pt reports improved adherence to fluid restriction.', tags: ['fluid', 'compliance'], order: 3 },
          { id: 905, text: 'Dietitian consult recommended for fluid management.', tags: ['fluid', 'referral'], order: 4 },
          { id: 906, text: 'Signs/symptoms of fluid overload: SOB, edema, JVD.', tags: ['fluid', 'overload'], order: 5 },
          { id: 907, text: 'Post-treatment weight at/near dry weight.', tags: ['fluid', 'weight'], order: 6 }
        ]
      }
    ]
  }
];

export const SnippetProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const syncDebounceRef = useRef(null);

  const [configurations, setConfigurations] = useState(() => {
    const saved = localStorage.getItem('hd-snippet-configs');
    return saved ? JSON.parse(saved) : DEFAULT_SNIPPETS;
  });

  const [activeConfigId, setActiveConfigId] = useState(() => {
    const saved = localStorage.getItem('hd-active-snippet-config');
    return saved ? parseInt(saved) : configurations[0]?.id || null;
  });

  const [tagFilter, setTagFilter] = useState(new Set());

  // Persist to localStorage (fallback)
  useEffect(() => {
    localStorage.setItem('hd-snippet-configs', JSON.stringify(configurations));
  }, [configurations]);

  useEffect(() => {
    localStorage.setItem('hd-active-snippet-config', activeConfigId?.toString() || '');
  }, [activeConfigId]);

  // ============================================
  // CLOUD SYNC FUNCTIONS
  // ============================================

  // Fetch snippets from Supabase
  const fetchCloudSnippets = useCallback(async () => {
    if (!isAuthenticated || !user) return [];

    try {
      const { data, error } = await supabase
        .from('snippet_configurations')
        .select(`
          *,
          snippet_sections(
            *,
            snippets(*)
          )
        `)
        .eq('user_id', user.id)
        .order('order_position', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        // No cloud snippets, save defaults to cloud
        await saveAllSnippetsToCloud(DEFAULT_SNIPPETS);
        return DEFAULT_SNIPPETS;
      }

      // Transform to local format
      return data.map(config => ({
        id: config.id,
        name: config.name,
        order: config.order_position,
        sections: (config.snippet_sections || []).map(section => ({
          id: section.id,
          name: section.name,
          icon: section.icon,
          order: section.order_position,
          snippets: (section.snippets || []).map(snippet => ({
            id: snippet.id,
            text: snippet.text,
            tags: snippet.tags || [],
            order: snippet.order_position || 0
          }))
        }))
      }));
    } catch (err) {
      console.error('Error fetching snippets:', err);
      return [];
    }
  }, [isAuthenticated, user]);

  // Save all snippets to cloud
  const saveAllSnippetsToCloud = async (configs) => {
    if (!isAuthenticated || !user) return;

    for (const config of configs) {
      await saveConfigToCloud(config);
    }
  };

  // Save single config to cloud
  const saveConfigToCloud = useCallback(async (config) => {
    if (!isAuthenticated || !user) return null;

    try {
      const configData = {
        user_id: user.id,
        name: config.name,
        order_position: config.order || 0
      };

      let savedConfig;
      const isCloudId = config.id > 1000000;

      if (isCloudId) {
        const { data, error } = await supabase
          .from('snippet_configurations')
          .update(configData)
          .eq('id', config.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        savedConfig = data;
      } else {
        const { data, error } = await supabase
          .from('snippet_configurations')
          .insert(configData)
          .select()
          .single();

        if (error) throw error;
        savedConfig = data;
      }

      // Sync sections
      if (config.sections && config.sections.length > 0) {
        for (const section of config.sections) {
          await saveSectionToCloud(savedConfig.id, section);
        }
      }

      console.log('Snippet config saved to cloud:', savedConfig.id);
      return savedConfig.id;
    } catch (err) {
      console.error('Error saving snippet config:', err);
      return null;
    }
  }, [isAuthenticated, user]);

  // Save section to cloud
  const saveSectionToCloud = async (configId, section) => {
    if (!isAuthenticated || !user) return null;

    try {
      const sectionData = {
        config_id: configId,
        name: section.name,
        icon: section.icon || '',
        order_position: section.order || 0
      };

      let savedSection;
      const isCloudId = section.id > 1000000;

      if (isCloudId) {
        const { data, error } = await supabase
          .from('snippet_sections')
          .update(sectionData)
          .eq('id', section.id)
          .select()
          .single();

        if (error) throw error;
        savedSection = data;
      } else {
        const { data, error } = await supabase
          .from('snippet_sections')
          .insert(sectionData)
          .select()
          .single();

        if (error) throw error;
        savedSection = data;
      }

      // Sync snippets in section
      if (section.snippets && section.snippets.length > 0) {
        for (const snippet of section.snippets) {
          await saveSnippetToCloud(savedSection.id, snippet);
        }
      }

      return savedSection.id;
    } catch (err) {
      console.error('Error saving section:', err);
      return null;
    }
  };

  // Save snippet to cloud
  const saveSnippetToCloud = async (sectionId, snippet) => {
    if (!isAuthenticated || !user) return null;

    try {
      const snippetData = {
        section_id: sectionId,
        text: snippet.text,
        tags: snippet.tags || []
      };

      const isCloudId = snippet.id > 1000000;

      if (isCloudId) {
        const { error } = await supabase
          .from('snippets')
          .update(snippetData)
          .eq('id', snippet.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('snippets')
          .insert(snippetData);

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error saving snippet:', err);
    }
  };

  // Debounced sync
  const syncConfigToCloud = useCallback((config) => {
    if (!isAuthenticated) return;

    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
    }

    syncDebounceRef.current = setTimeout(() => {
      saveConfigToCloud(config);
    }, 1000);
  }, [isAuthenticated, saveConfigToCloud]);

  // Load from cloud on auth
  useEffect(() => {
    const loadFromCloud = async () => {
      if (isAuthenticated && user) {
        const cloudConfigs = await fetchCloudSnippets();
        if (cloudConfigs && cloudConfigs.length > 0) {
          setConfigurations(cloudConfigs);
          if (!activeConfigId || !cloudConfigs.find(c => c.id === activeConfigId)) {
            setActiveConfigId(cloudConfigs[0].id);
          }
        }
      }
    };
    loadFromCloud();
  }, [isAuthenticated, user, fetchCloudSnippets]);

  // Compute active configuration with memoization (stable reference)
  const activeConfig = useMemo(() => {
    let config = configurations.find(c => c.id === activeConfigId);

    // Fallback to first available config if active not found
    if (!config && configurations.length > 0) {
      config = configurations[0];
    }

    // Fallback to defaults if no configs at all
    if (!config) {
      return DEFAULT_SNIPPETS[0];
    }

    // Ensure sections array exists
    if (!config.sections || config.sections.length === 0) {
      return { ...config, sections: DEFAULT_SNIPPETS[0].sections };
    }

    // Merge sections with default snippets if sections have no snippets
    const sectionsWithSnippets = config.sections.map((section, index) => {
      if (!section.snippets || section.snippets.length === 0) {
        // Find matching default section by name or index
        const defaultSection = DEFAULT_SNIPPETS[0].sections.find(ds => ds.name === section.name)
          || DEFAULT_SNIPPETS[0].sections[index];
        if (defaultSection) {
          return { ...section, snippets: defaultSection.snippets };
        }
      }
      return section;
    });

    return { ...config, sections: sectionsWithSnippets };
  }, [configurations, activeConfigId]);

  // Keep getActiveConfig for backward compatibility but return memoized value
  const getActiveConfig = useCallback(() => activeConfig, [activeConfig]);

  // Get all unique tags
  const getAllTags = () => {
    const tags = new Set();
    configurations.forEach(config => {
      config.sections?.forEach(section => {
        section.snippets?.forEach(snippet => {
          snippet.tags?.forEach(tag => tags.add(tag));
        });
      });
    });
    return Array.from(tags);
  };

  // Filter snippets by tags
  const getFilteredSnippets = (sectionId) => {
    const config = getActiveConfig();
    if (!config) return [];

    const section = config.sections?.find(s => s.id === sectionId);
    if (!section) return [];

    if (tagFilter.size === 0) {
      return section.snippets || [];
    }

    return section.snippets?.filter(snippet =>
      snippet.tags?.some(tag => tagFilter.has(tag))
    ) || [];
  };

  // Update configurations with cloud sync
  const updateConfigurations = (newConfigs) => {
    setConfigurations(newConfigs);
    // Sync the active config to cloud
    const activeConfig = newConfigs.find(c => c.id === activeConfigId);
    if (activeConfig) {
      syncConfigToCloud(activeConfig);
    }
  };

  const value = {
    configurations,
    setConfigurations: updateConfigurations,
    activeConfigId,
    setActiveConfigId,
    tagFilter,
    setTagFilter,
    activeConfig,        // Direct access to memoized config
    getActiveConfig,     // Function for backward compatibility
    getAllTags,
    getFilteredSnippets
  };

  return (
    <SnippetContext.Provider value={value}>
      {children}
    </SnippetContext.Provider>
  );
};
