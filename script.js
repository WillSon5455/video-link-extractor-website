// script.js

let currentVideos = []; // To store the full list of videos

function showToast(message) {
  const toast = document.getElementById('toastNotification');
  toast.textContent = message;
  toast.className = "toast-notification show";
  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
  }, 3000); // 3 seconds
}

function updateTheme(theme) {
  const body = document.body;
  if (theme === 'dark') {
    body.classList.remove('theme-light');
    body.classList.add('theme-dark');
    document.getElementById('toggleThemeBtn').innerHTML = '<i class="fas fa-sun"></i>';
    document.getElementById('toggleThemeBtn').title = 'Toggle Light Mode';
  } else {
    body.classList.remove('theme-dark');
    body.classList.add('theme-light');
    document.getElementById('toggleThemeBtn').innerHTML = '<i class="fas fa-moon"></i>';
    document.getElementById('toggleThemeBtn').title = 'Toggle Dark Mode';
  }
  localStorage.setItem('preferredTheme', theme); // Using localStorage
}

document.addEventListener('DOMContentLoaded', () => {
  const inputSection = document.getElementById('inputSection');
  const htmlSourceInput = document.getElementById('htmlSourceInput');
  const htmlFileInput = document.getElementById('htmlFileInput');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const extractLinksBtn = document.getElementById('extractLinksBtn');

  const loadingSpinner = document.getElementById('loadingSpinner');
  const videoLinksContainer = document.getElementById('videoLinksContainer');
  const videoLinksList = document.getElementById('videoLinksList');
  const filterInput = document.getElementById('filterInput');
  const selectAllBtn = document.getElementById('selectAllBtn');
  const openSelectedBtn = document.getElementById('openSelectedBtn');
  const copySelectedUrlBtn = document.getElementById('copySelectedUrlBtn');
  const openAllBtn = document.getElementById('openAllBtn');
  const copyAllUrlBtn = document.getElementById('copyAllUrlBtn');
  const shareBtn = document.getElementById('shareBtn');
  const exportBtn = document.getElementById('exportBtn');
  const saveListBtn = document.getElementById('saveListBtn');
  const loadListInput = document.getElementById('loadListInput');
  const loadListBtn = document.getElementById('loadListBtn');
  const toggleThemeBtn = document.getElementById('toggleThemeBtn');

  // Load preferred theme on startup
  updateTheme(localStorage.getItem('preferredTheme') || 'dark'); // Default to dark

  toggleThemeBtn.addEventListener('click', () => {
    const currentTheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
    updateTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });

  htmlFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      fileNameDisplay.textContent = file.name;
    } else {
      fileNameDisplay.textContent = 'No file chosen';
    }
  });

  extractLinksBtn.addEventListener('click', () => {
    const htmlSource = htmlSourceInput.value.trim();
    const htmlFile = htmlFileInput.files[0];

    if (!htmlSource && !htmlFile) {
      showToast("Please paste HTML source or upload an HTML file.");
      return;
    }

    loadingSpinner.style.display = 'flex';
    inputSection.style.display = 'none';
    videoLinksContainer.style.display = 'none';

    if (htmlFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        processHtmlSource(e.target.result);
      };
      reader.onerror = () => {
        showExtractionError("Error reading file.");
      };
      reader.readAsText(htmlFile);
    } else {
      processHtmlSource(htmlSource);
    }
  });

  function processHtmlSource(htmlSource) {
    loadingSpinner.style.display = 'none';
    videoLinksContainer.style.display = 'block';

    if (!htmlSource) {
      showExtractionError("No HTML source provided or file was empty.");
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlSource, 'text/html');

    const elements = doc.querySelectorAll('[data-vid]');
    const rawVideos = [];

    elements.forEach(el => {
      const vid = el.getAttribute('data-vid');
      const subject = el.getAttribute('data-nname') || "No Subject";
      const order = el.getAttribute('data-vit') || "0";
      if (vid) {
        rawVideos.push({
          id: vid,
          subject: subject,
          order: Number(order)
        });
      }
    });

    rawVideos.sort((a, b) => a.order - b.order);
    currentVideos = rawVideos;

    renderVideoList(currentVideos);

    if (currentVideos.length === 0) {
      videoLinksContainer.innerHTML = `
        <div class="empty-message">
          <i class="fas fa-video-slash"></i>
          <p>No video links found in the provided HTML.</p>
          <p>This tool extracts YouTube video IDs from elements with 'data-vid' attribute.</p>
          <button id="backToInputBtn" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back to Input</button>
        </div>
      `;
      document.getElementById('backToInputBtn').addEventListener('click', resetUI);
      disableAllButtons();
    } else {
      updateButtonStates();
    }
  }

  function showExtractionError(message) {
      videoLinksContainer.innerHTML = `
        <div class="empty-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>${message}</p>
          <button id="backToInputBtn" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back to Input</button>
        </div>
      `;
      document.getElementById('backToInputBtn').addEventListener('click', resetUI);
      disableAllButtons();
  }

  function resetUI() {
      inputSection.style.display = 'flex';
      videoLinksContainer.style.display = 'none';
      htmlSourceInput.value = '';
      htmlFileInput.value = null; // Clear file input
      fileNameDisplay.textContent = 'No file chosen';
      currentVideos = []; // Clear current videos
      videoLinksList.innerHTML = ''; // Clear displayed list
      filterInput.value = ''; // Clear filter
      updateButtonStates(); // Disable buttons
  }

  function renderVideoList(videosToRender) {
    videoLinksList.innerHTML = '';
    if (videosToRender.length === 0 && currentVideos.length > 0) {
        videoLinksList.innerHTML = `<div class="empty-message"><i class="fas fa-search"></i><p>No videos match your filter.</p></div>`;
        return;
    }

    videosToRender.forEach(video => {
      const li = document.createElement('li');
      li.dataset.videoId = video.id;
      li.dataset.videoSubject = video.subject;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'video-checkbox';
      checkbox.checked = video.checked || false;
      checkbox.addEventListener('change', updateButtonStates);

      const contentDiv = document.createElement('div');
      contentDiv.className = 'video-item-content';

      const textSpan = document.createElement('span');
      textSpan.textContent = `${video.order}. ${video.subject}: `;

      const link = document.createElement('a');
      link.href = `https://www.youtube.com/watch?v=${video.id}`; // Changed to YouTube URL
      link.target = '_blank';
      link.textContent = `https://www.youtube.com/watch?v=${video.id}`;

      li.addEventListener('click', (e) => {
        if (!e.target.closest('a') && !e.target.closest('.video-checkbox')) {
          li.classList.toggle('watched');
          const watchedVideos = JSON.parse(localStorage.getItem('watchedVideos') || '{}');
          if (li.classList.contains('watched')) {
            watchedVideos[video.id] = true;
          } else {
            delete watchedVideos[video.id];
          }
          localStorage.setItem('watchedVideos', JSON.stringify(watchedVideos));
        }
      });

      const watchedVideos = JSON.parse(localStorage.getItem('watchedVideos') || '{}');
      if (watchedVideos[video.id]) {
        li.classList.add('watched');
      }

      contentDiv.appendChild(textSpan);
      contentDiv.appendChild(link);
      li.appendChild(checkbox);
      li.appendChild(contentDiv);
      videoLinksList.appendChild(li);
    });
    updateButtonStates();
  }

  filterInput.addEventListener('input', () => {
    const filterText = filterInput.value.toLowerCase();
    const filteredVideos = currentVideos.filter(video =>
      video.subject.toLowerCase().includes(filterText) ||
      video.id.toLowerCase().includes(filterText) ||
      String(video.order).includes(filterText)
    );
    renderVideoList(filteredVideos);
  });

  function getSelectedVideos() {
    const selectedCheckboxes = document.querySelectorAll('.video-checkbox:checked');
    const selectedVideos = [];
    selectedCheckboxes.forEach(checkbox => {
      const li = checkbox.closest('li');
      const videoId = li.dataset.videoId;
      const videoSubject = li.dataset.videoSubject;
      const videoOrder = li.querySelector('span').textContent.split('.')[0].trim();
      selectedVideos.push({
        id: videoId,
        subject: videoSubject,
        order: Number(videoOrder)
      });
    });
    return selectedVideos;
  }

  function updateButtonStates() {
    const anyChecked = document.querySelectorAll('.video-checkbox:checked').length > 0;
    openSelectedBtn.disabled = !anyChecked;
    copySelectedUrlBtn.disabled = !anyChecked;

    const anyVideos = currentVideos.length > 0;
    openAllBtn.disabled = !anyVideos;
    copyAllUrlBtn.disabled = !anyVideos;
    shareBtn.disabled = !anyVideos;
    exportBtn.disabled = !anyVideos;
    saveListBtn.disabled = !anyVideos;
    selectAllBtn.disabled = !anyVideos;
  }

  selectAllBtn.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.video-checkbox');
    const allSelected = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allSelected);
    selectAllBtn.innerHTML = allSelected ? '<i class="fas fa-check-double btn-icon"></i> Select All' : '<i class="fas fa-times-circle btn-icon"></i> Deselect All';
    updateButtonStates();
  });

  openSelectedBtn.addEventListener('click', () => {
    const selectedVideos = getSelectedVideos();
    if (selectedVideos.length === 0) {
      showToast("No videos selected.");
      return;
    }
    selectedVideos.forEach(video => {
      window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank');
    });
    showToast(`Opened ${selectedVideos.length} selected video(s).`);
  });

  copySelectedUrlBtn.addEventListener('click', () => {
    const selectedVideos = getSelectedVideos();
    if (selectedVideos.length === 0) {
      showToast("No videos selected.");
      return;
    }
    let videoUrls = selectedVideos.map(video => `https://www.youtube.com/watch?v=${video.id}`).join('\n');
    navigator.clipboard.writeText(videoUrls)
      .then(() => showToast(`${selectedVideos.length} selected URL(s) copied to clipboard!`))
      .catch((err) => console.error("Error copying selected URLs: ", err));
  });

  openAllBtn.addEventListener('click', () => {
    currentVideos.forEach(video => {
      window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank');
    });
    showToast(`Opened all ${currentVideos.length} video(s).`);
  });

  copyAllUrlBtn.addEventListener('click', () => {
    let videoUrls = currentVideos.map(video => `https://www.youtube.com/watch?v=${video.id}`).join('\n');
    navigator.clipboard.writeText(videoUrls)
      .then(() => showToast(`All ${currentVideos.length} URL(s) copied to clipboard!`))
      .catch((err) => console.error("Error copying all URLs: ", err));
  });

  shareBtn.addEventListener('click', () => {
    let videoText = "";
    currentVideos.forEach(video => {
      videoText += `${video.order}. ${video.subject}: https://www.youtube.com/watch?v=${video.id}\n`;
    });
    if (navigator.share) {
      navigator.share({
        title: "Video Links",
        text: videoText,
      })
      .then(() => showToast("Video links shared successfully!"))
      .catch((error) => console.error("Error sharing:", error));
    } else {
      navigator.clipboard.writeText(videoText).then(() => {
        showToast("Video links copied to clipboard!");
      }).catch((err) => console.error("Error copying to clipboard:", err));
    }
  });

  exportBtn.addEventListener('click', () => {
    let videoText = "";
    currentVideos.forEach(video => {
      videoText += `${video.order}. ${video.subject}: https://www.youtube.com/watch?v=${video.id}\n`;
    });
    let format = prompt("Enter export format (text/pdf/json):", "text");
    if (format) {
      format = format.toLowerCase();
      if (format === "pdf") {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const lines = doc.splitTextToSize(videoText, 180);
        doc.text(lines, 10, 10);
        doc.save("video_links.pdf");
        showToast("Video links exported as PDF!");
      } else if (format === "text") {
        const blob = new Blob([videoText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "video_links.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Video links exported as text file!");
      } else if (format === "json") {
        const jsonContent = JSON.stringify(currentVideos, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "video_links.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Video links exported as JSON!");
      } else {
        showToast("Unsupported format. Please enter 'text', 'pdf', or 'json'.");
      }
    }
  });

  saveListBtn.addEventListener('click', () => {
    const listToSave = currentVideos.map(video => ({
        id: video.id,
        subject: video.subject,
        order: video.order
    }));
    const jsonContent = JSON.stringify(listToSave, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video_list_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Video list saved as JSON file!");
  });

  loadListBtn.addEventListener('click', () => {
    loadListInput.click();
  });

  loadListInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const loadedContent = JSON.parse(e.target.result);
          if (Array.isArray(loadedContent) && loadedContent.every(item => item.id && item.subject)) {
            loadedContent.sort((a, b) => (a.order || 0) - (b.order || 0) || a.subject.localeCompare(b.subject) || a.id.localeCompare(b.id));
            currentVideos = loadedContent;
            renderVideoList(currentVideos);
            showToast(`Loaded ${currentVideos.length} videos from file!`);
            // Show video links container and hide input section
            inputSection.style.display = 'none';
            videoLinksContainer.style.display = 'block';
          } else {
            showToast("Invalid file format. Please load a valid video list JSON.");
          }
        } catch (error) {
          showToast("Error parsing file. Ensure it's a valid JSON or text file.");
          console.error("Error loading file:", error);
        }
      };
      reader.readAsText(file);
    }
  });

  function disableAllButtons() {
    const buttons = document.querySelectorAll('.button-group button, .controls button');
    buttons.forEach(btn => btn.disabled = true);
    filterInput.disabled = true;
    selectAllBtn.disabled = true;
  }

  // Initial state on page load
  resetUI();
});