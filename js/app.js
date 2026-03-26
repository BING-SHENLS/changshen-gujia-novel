(function () {
  const sidebar = document.getElementById('sidebar');
  const sidebarNav = document.getElementById('sidebarNav');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const mainContent = document.getElementById('mainContent');
  const articleWrap = document.getElementById('articleWrap');
  const fontUpBtn = document.getElementById('fontUp');
  const fontDownBtn = document.getElementById('fontDown');

  let currentChapterIndex = -1;
  let fontSize = parseInt(localStorage.getItem('novel-font-size')) || 18;
  const chapterCache = {};

  // Group chapters by act
  function groupByAct(chapters) {
    const groups = {};
    const order = [];
    chapters.forEach(function (ch, idx) {
      if (!groups[ch.act]) {
        groups[ch.act] = [];
        order.push(ch.act);
      }
      groups[ch.act].push({ act: ch.act, title: ch.title, path: ch.path, index: idx });
    });
    return { groups: groups, order: order };
  }

  // Build sidebar
  function buildSidebar() {
    var ref = groupByAct(CHAPTERS);
    var groups = ref.groups;
    var order = ref.order;
    var html = '';
    order.forEach(function (act) {
      html += '<div class="act-group">';
      html += '<div class="act-title">' + act + '</div>';
      groups[act].forEach(function (ch) {
        html += '<button class="chapter-item" data-index="' + ch.index + '">' + ch.title + '</button>';
      });
      html += '</div>';
    });
    sidebarNav.innerHTML = html;

    sidebarNav.querySelectorAll('.chapter-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        loadChapter(parseInt(btn.dataset.index));
      });
    });
  }

  // Load chapter via fetch
  async function loadChapter(index) {
    if (index < 0 || index >= CHAPTERS.length) return;
    currentChapterIndex = index;

    // Show loading
    articleWrap.innerHTML = '<div class="empty-state">載入中……</div>';

    // Update active state
    sidebarNav.querySelectorAll('.chapter-item').forEach(function (btn) {
      btn.classList.toggle('active', parseInt(btn.dataset.index) === index);
    });

    // On mobile, close sidebar
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('open');
    }

    try {
      var markdown;
      if (chapterCache[index]) {
        markdown = chapterCache[index];
      } else {
        var url = encodeURI(CHAPTERS[index].path);
        var response = await fetch(url);
        if (!response.ok) throw new Error(response.status);
        markdown = await response.text();
        chapterCache[index] = markdown;
      }

      articleWrap.innerHTML = marked.parse(markdown);
      mainContent.scrollTop = 0;
      localStorage.setItem('novel-last-chapter', index);
    } catch (err) {
      articleWrap.innerHTML =
        '<div class="empty-state">章節載入失敗（' + err.message + '）<br>請檢查檔案路徑是否正確</div>';
    }
  }

  // Font size
  function applyFontSize() {
    document.documentElement.style.setProperty('--content-font-size', fontSize + 'px');
    localStorage.setItem('novel-font-size', fontSize);
  }

  fontUpBtn.addEventListener('click', function () {
    if (fontSize < 28) { fontSize += 2; applyFontSize(); }
  });

  fontDownBtn.addEventListener('click', function () {
    if (fontSize > 12) { fontSize -= 2; applyFontSize(); }
  });

  // Sidebar toggle
  sidebarToggle.addEventListener('click', function () {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('open');
    } else {
      sidebar.classList.toggle('collapsed');
    }
    var isCollapsed = sidebar.classList.contains('collapsed');
    var isOpen = sidebar.classList.contains('open');
    if (window.innerWidth <= 768) {
      sidebarToggle.textContent = isOpen ? '◀' : '▶';
    } else {
      sidebarToggle.textContent = isCollapsed ? '▶' : '◀';
    }
  });

  // Configure marked
  marked.setOptions({
    breaks: true,
    gfm: true
  });

  // Init
  buildSidebar();
  applyFontSize();

  // Restore last read position
  var lastChapter = parseInt(localStorage.getItem('novel-last-chapter'));
  if (!isNaN(lastChapter) && lastChapter >= 0 && lastChapter < CHAPTERS.length) {
    loadChapter(lastChapter);
  } else {
    loadChapter(0);
  }
})();
