(() => {
    const uploadForm = document.getElementById('uploadForm');
    const photoInput = document.getElementById('photoInput');
    const tagsInput = document.getElementById('tagsInput');
    const photoInputError = document.getElementById('photoInputError');
    const tagsInputError = document.getElementById('tagsInputError');
    const photoGallery = document.getElementById('photoGallery');
    const galleryEmptyMsg = document.getElementById('galleryEmptyMsg');
    const tagsContainer = document.getElementById('tagsContainer');
    const clearFilterBtn = document.getElementById('clearFilterBtn');
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');

    // State
    let photos = [];
    let filterTags = new Set();

    // Utility: sanitize and normalize tags
    function normalizeTag(tag) {
      return tag.trim().toLowerCase();
    }

    // Utility: create tag button element
    function createTagButton(tag, selected = false) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tag-button';
      if (selected) btn.classList.add('selected');
      btn.textContent = tag;
      btn.setAttribute('aria-pressed', selected);
      btn.setAttribute('aria-label', `${selected ? 'Remove' : 'Add'} filter tag ${tag}`);
      btn.addEventListener('click', () => {
        if (filterTags.has(tag)) {
          filterTags.delete(tag);
        } else {
          filterTags.add(tag);
        }
        updateFilterTagsUI();
        renderGallery();
      });
      return btn;
    }

    // Utility: create photo card element
    function createPhotoCard(photo) {
      const li = document.createElement('li');
      li.className = 'photo-card';
      li.tabIndex = 0;
      li.setAttribute('aria-label', `Photo with tags: ${photo.tags.join(', ')}`);

      const img = document.createElement('img');
      img.src = photo.url;
      img.alt = photo.alt;
      img.loading = 'lazy';

      const info = document.createElement('div');
      info.className = 'photo-info';

      photo.tags.forEach((tag) => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'photo-tag';
        tagSpan.textContent = tag;
        info.appendChild(tagSpan);
      });

      li.appendChild(img);
      li.appendChild(info);

      return li;
    }

    // Validate file types and size (max 10MB per file)
    function validateFiles(files) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      for (const file of files) {
        if (!validTypes.includes(file.type)) {
          return `File "${file.name}" is not a supported image type.`;
        }
        if (file.size > maxSize) {
          return `File "${file.name}" exceeds the 10MB size limit.`;
        }
      }
      return null;
    }

    // Parse tags input string into array of unique normalized tags
    function parseTags(input) {
      if (!input) return [];
      const rawTags = input.split(',');
      const normalizedTags = rawTags
        .map(normalizeTag)
        .filter((t) => t.length > 0);
      // Remove duplicates
      return [...new Set(normalizedTags)];
    }

    // Update filter tags UI
    function updateFilterTagsUI() {
      // Collect all unique tags from photos
      const allTagsSet = new Set();
      photos.forEach((photo) => {
        photo.tags.forEach((tag) => allTagsSet.add(tag));
      });
      const allTags = Array.from(allTagsSet).sort();

      // Clear container
      tagsContainer.innerHTML = '';

      if (allTags.length === 0) {
        const noTagsMsg = document.createElement('p');
        noTagsMsg.className = 'help-text';
        noTagsMsg.textContent = 'No tags available yet.';
        tagsContainer.appendChild(noTagsMsg);
        clearFilterBtn.disabled = true;
        return;
      }

      clearFilterBtn.disabled = false;

      allTags.forEach((tag) => {
        const selected = filterTags.has(tag);
        const btn = createTagButton(tag, selected);
        tagsContainer.appendChild(btn);
      });
    }

    // Render gallery based on photos and filterTags
    function renderGallery() {
      photoGallery.innerHTML = '';

      let filteredPhotos = photos;
      if (filterTags.size > 0) {
        filteredPhotos = photos.filter((photo) =>
          [...filterTags].every((tag) => photo.tags.includes(tag))
        );
      }

      if (filteredPhotos.length === 0) {
        galleryEmptyMsg.textContent =
          photos.length === 0
            ? 'No photos uploaded yet. Use the upload section above to add photos.'
            : 'No photos match the selected filter tags.';
        galleryEmptyMsg.classList.add('visible');
        return;
      } else {
        galleryEmptyMsg.classList.remove('visible');
      }

      const fragment = document.createDocumentFragment();
      filteredPhotos.forEach((photo) => {
        const card = createPhotoCard(photo);
        fragment.appendChild(card);
      });
      photoGallery.appendChild(fragment);
    }

    // Reset form errors
    function resetErrors() {
      photoInputError.textContent = '';
      photoInputError.style.display = 'none';
      tagsInputError.textContent = '';
      tagsInputError.style.display = 'none';
    }

    // Handle form submission
    uploadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      resetErrors();

      const files = photoInput.files;
      const tagsRaw = tagsInput.value;

      // Validate files
      if (!files || files.length === 0) {
        photoInputError.textContent = 'Please select at least one photo to upload.';
        photoInputError.style.display = 'block';
        photoInput.focus();
        return;
      }
      const fileValidationError = validateFiles(files);
      if (fileValidationError) {
        photoInputError.textContent = fileValidationError;
        photoInputError.style.display = 'block';
        photoInput.focus();
        return;
      }

      // Validate tags (optional but if provided, must be valid)
      const tags = parseTags(tagsRaw);
      if (tagsRaw.trim() !== '' && tags.length === 0) {
        tagsInputError.textContent = 'Please enter valid tags separated by commas.';
        tagsInputError.style.display = 'block';
        tagsInput.focus();
        return;
      }

      // Read files as data URLs and add to photos array
      const readers = [];
      for (const file of files) {
        readers.push(
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                url: reader.result,
                alt: `User uploaded photo named ${file.name}`,
                tags,
              });
            };
            reader.onerror = () => {
              reject(new Error(`Failed to read file ${file.name}`));
            };
            reader.readAsDataURL(file);
          })
        );
      }

      Promise.all(readers)
        .then((newPhotos) => {
          photos = photos.concat(newPhotos);
          // Clear inputs
          uploadForm.reset();
          filterTags.clear();
          updateFilterTagsUI();
          renderGallery();
          // Focus back to photo input for convenience
          photoInput.focus();
        })
        .catch((err) => {
          photoInputError.textContent = err.message;
          photoInputError.style.display = 'block';
        });
    });

    // Clear filter button
    clearFilterBtn.addEventListener('click', () => {
      filterTags.clear();
      updateFilterTagsUI();
      renderGallery();
    });

    // Mobile menu toggle
    mobileMenuButton.addEventListener('click', () => {
      const expanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
      mobileMenuButton.setAttribute('aria-expanded', !expanded);
      if (expanded) {
        mobileMenu.classList.remove('show');
      } else {
        mobileMenu.classList.add('show');
      }
    });

    // Initial UI setup
    updateFilterTagsUI();
    renderGallery();
  })();