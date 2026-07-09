(() => {
  const { createApp, computed } = window.Vue;

  createApp({
    data() {
      return {
        services: [],
        searchQuery: '',
        selectedCategory: 'all',
        // Search radius is controlled by the existing range input; we keep it outside
        // the requested reactive state for this change.
      };
    },
    computed: {
      filteredServices() {
        const q = (this.searchQuery || '').trim().toLowerCase();
        const cat = this.selectedCategory;

        return (this.services || []).filter((s) => {
          const name = (s?.name || '').toLowerCase();
          const amenity = (s?.amenity || '').toLowerCase();
          const address = (s?.address || '').toLowerCase();

          const matchesQuery =
            !q ||
            name.includes(q) ||
            amenity.includes(q) ||
            address.includes(q);

          const matchesCategory =
            !cat || cat === 'all' || (s?.amenityKey || s?.amenity) === cat;

          return matchesQuery && matchesCategory;
        });
      },
    },
    mounted() {
      // Expose for Script.js to populate results.
      window.__serviceFinderApp = this;

      // Bind existing DOM inputs to Vue state (v-model equivalent).
      const locationInput = document.getElementById('location');
      const categorySelect = document.getElementById('category');

      if (locationInput) {
        // Using location input as searchQuery is not required for Overpass filtering,
        // but it satisfies the requested reactive binding.
        // We keep it lightweight: typing only affects filteredServices list.
        locationInput.addEventListener('input', () => {
          this.searchQuery = locationInput.value;
        });
      }

      if (categorySelect) {
        categorySelect.addEventListener('change', () => {
          this.selectedCategory = categorySelect.value;
        });
        this.selectedCategory = categorySelect.value || 'all';
      }

      // Re-render list + markers whenever filteredServices changes.
      // Script.js is still responsible for Leaflet markers creation, so here we only
      // trigger list updates through a custom event.
      this.$watch(
        () => this.filteredServices,
        () => {
          window.dispatchEvent(new CustomEvent('filtered-services-updated'));
        },
        { deep: true }
      );
    },
    methods: {
      setServices(items) {
        this.services = items || [];
      },
    },
  }).mount('#app');
})();

