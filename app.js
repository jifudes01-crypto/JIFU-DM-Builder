const fakeData = {
  templates: [
    {
      id: "classic-a4",
      name: "經典直式 A4",
      use: "每月精選物件",
      size: "A4 直式",
      version: "v1.4",
      thumbnailType: "portrait",
      lockedLayers: ["品牌色條", "頁尾名片區", "Logo 位置", "價格樣式"],
      slotCount: 18,
      completeness: 96,
      status: "active",
      artboardClass: "artboard-a4"
    },
    {
      id: "luxury-wide",
      name: "豪宅橫式雙欄",
      use: "高總價物件",
      size: "A4 橫式",
      version: "v1.1",
      thumbnailType: "wide",
      lockedLayers: ["雙欄格線", "主視覺比例", "品牌字級", "經紀資訊"],
      slotCount: 22,
      completeness: 91,
      status: "active",
      artboardClass: "artboard-a4-wide"
    },
    {
      id: "line-square",
      name: "LINE 方形快訊",
      use: "社群快速發布",
      size: "LINE 方形",
      version: "v0.9",
      thumbnailType: "square",
      lockedLayers: ["方形主圖框", "CTA 區塊", "品牌色票", "QR 預留位"],
      slotCount: 12,
      completeness: 84,
      status: "review",
      artboardClass: "artboard-square"
    },
    {
      id: "social-portrait",
      name: "社群 4:5 精選",
      use: "社群快速發布",
      size: "社群 4:5",
      version: "v1.0",
      thumbnailType: "portrait",
      lockedLayers: ["社群標題區", "圖片安全邊界", "價格標籤", "品牌頁尾"],
      slotCount: 15,
      completeness: 89,
      status: "active",
      artboardClass: "artboard-social"
    }
  ],
  propertyRows: [
    {
      id: "p-001",
      name: "信義景觀三房",
      location: "台北市信義區",
      price: "NT$ 58,800,000",
      beds: "3 房",
      size: "42 坪",
      type: "住宅",
      image: "固定主圖 A",
      agent: "吉富房屋 / 王專員",
      summary: "近捷運、採光佳、格局方正，適合家庭換屋。"
    },
    {
      id: "p-002",
      name: "大安靜巷電梯宅",
      location: "台北市大安區",
      price: "NT$ 46,800,000",
      beds: "2+1 房",
      size: "35 坪",
      type: "電梯華廈",
      image: "固定主圖 B",
      agent: "吉富房屋 / 林專員",
      summary: "生活機能成熟，靜巷低噪音，適合自住與長期持有。"
    },
    {
      id: "p-003",
      name: "天母綠景樓中樓",
      location: "台北市士林區",
      price: "NT$ 72,000,000",
      beds: "4 房",
      size: "68 坪",
      type: "樓中樓",
      image: "固定主圖 C",
      agent: "吉富房屋 / 陳專員",
      summary: "大面窗景、雙主臥配置，適合重視空間感的家庭。"
    }
  ],
  fieldMatches: [
    { id: "m1", source: "property_name", target: "主標題", confidence: "高", status: "matched" },
    { id: "m2", source: "location", target: "區域標籤", confidence: "高", status: "matched" },
    { id: "m3", source: "price_total", target: "售價欄位", confidence: "高", status: "matched" },
    { id: "m4", source: "cover_image", target: "主圖區", confidence: "中", status: "matched" },
    { id: "m5", source: "agent_note", target: "特色說明", confidence: "待確認", status: "review" }
  ],
  slotOptions: ["主標題", "區域標籤", "售價欄位", "主圖區", "特色說明", "坪數欄位", "房型欄位", "承辦資訊"],
  brandKit: {
    logo: "JF",
    colors: ["#117963", "#0b5f4d", "#bd7417", "#f7f8f3"],
    fonts: ["Noto Sans TC", "Microsoft JhengHei"],
    restrictions: ["品牌色不可改", "Logo 位置不可改", "價格樣式不可改", "圖片比例不可改"]
  },
  outputChecks: [
    { label: "圖片欄位", detail: "3 筆資料都有主圖", status: "pass" },
    { label: "價格格式", detail: "已套用 NT$ 與千分位格式", status: "pass" },
    { label: "文字長度", detail: "1 筆特色說明需確認", status: "warn" },
    { label: "欄位對應", detail: "agent_note 尚待確認", status: "warn" }
  ]
};

const state = {
  currentSpace: "front",
  activeTool: "templates",
  selectedTemplateId: "classic-a4",
  selectedPropertyIndex: 0,
  zoom: 92,
  uploaded: false,
  filters: {
    search: "",
    use: "all",
    size: "all",
    status: "all"
  }
};

const toolMeta = {
  templates: { eyebrow: "Template Library", title: "模板庫" },
  data: { eyebrow: "Data Source", title: "物件資料" },
  fields: { eyebrow: "Field Matching", title: "欄位判定" },
  brand: { eyebrow: "Brand Kit", title: "品牌素材" },
  export: { eyebrow: "Export Center", title: "匯出檢查" }
};

const modalContent = {
  rules: {
    eyebrow: "Layout Guard",
    title: "套版規則",
    body: `
      <p>這一版借鏡 Canva 的工作區操作感，但吉富的模板維持鎖定。使用者只能選擇模板、切換資料、確認欄位與輸出狀態。</p>
      <ul>
        <li>模板座標、品牌元素與圖片比例維持鎖定。</li>
        <li>AI 僅協助欄位判定，不會產生內容。</li>
        <li>未知欄位進入待確認，不會自動套入未授權區塊。</li>
      </ul>
    `
  },
  template: {
    eyebrow: "Template Registry",
    title: "新增模板規則",
    body: `
      <div class="form-grid">
        <label class="field"><span>模板名稱</span><input value="新模板 Demo" /></label>
        <label class="field"><span>用途</span><input value="每月精選物件" /></label>
        <label class="field"><span>尺寸</span><select><option>A4 直式</option><option>A4 橫式</option><option>LINE 方形</option></select></label>
      </div>
      <p>正式版會在這裡維護模板 metadata、欄位槽位與鎖定層。Demo 不會寫入資料。</p>
    `
  }
};

function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

function qsa(selector, scope = document) {
  return [...scope.querySelectorAll(selector)];
}

function selectedTemplate() {
  return fakeData.templates.find((template) => template.id === state.selectedTemplateId) || fakeData.templates[0];
}

function selectedProperty() {
  return fakeData.propertyRows[state.selectedPropertyIndex] || fakeData.propertyRows[0];
}

function statusBadge(status, text) {
  const className = status === "pass" || status === "active" || status === "matched" ? "status-good" : status === "warn" || status === "review" ? "status-warn" : "";
  return `<span class="status-pill ${className}">${text}</span>`;
}

function confidenceClass(confidence) {
  if (confidence === "高") return "confidence-high";
  if (confidence === "中") return "confidence-mid";
  return "confidence-review";
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  qs("[data-toast-host]").appendChild(toast);
  window.setTimeout(() => toast.remove(), 2800);
}

function openModal(type) {
  const content = modalContent[type] || modalContent.rules;
  qs("#modalEyebrow").textContent = content.eyebrow;
  qs("#modalTitle").textContent = content.title;
  qs("#modalBody").innerHTML = content.body;
  qs("[data-modal]").hidden = false;
}

function closeModal() {
  qs("[data-modal]").hidden = true;
}

function openLineMenu() {
  const menu = qs("[data-line-menu]");
  menu.classList.add("is-open");
  menu.setAttribute("aria-hidden", "false");
}

function closeLineMenu() {
  const menu = qs("[data-line-menu]");
  menu.classList.remove("is-open");
  menu.setAttribute("aria-hidden", "true");
}

function isMobileWidth() {
  return window.matchMedia("(max-width: 920px)").matches;
}

function setSpace(space) {
  state.currentSpace = space;
  qs(".app-shell").dataset.space = space;
  qsa("[data-space-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.spacePanel === space);
  });
  qsa("[data-space-switch]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.spaceSwitch === space);
  });
  closeLineMenu();
  if (space === "front" && isMobileWidth()) {
    qs("[data-asset-panel]").classList.remove("is-open");
  }
}

function setTool(tool, openPanel = false) {
  state.activeTool = tool;
  const meta = toolMeta[tool];
  qs("[data-tool-eyebrow]").textContent = meta.eyebrow;
  qs("[data-tool-title]").textContent = meta.title;
  qsa("[data-tool]").forEach((button) => button.classList.toggle("is-active", button.dataset.tool === tool));
  qsa("[data-mobile-tool]").forEach((button) => button.classList.toggle("is-active", button.dataset.mobileTool === tool));
  qsa("[data-tool-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.toolPanel !== tool;
  });
  if (openPanel || !isMobileWidth()) {
    qs("[data-asset-panel]").classList.add("is-open");
  }
  closeLineMenu();
}

function filteredTemplates() {
  const search = state.filters.search.trim().toLowerCase();
  return fakeData.templates.filter((template) => {
    const matchesSearch = !search || `${template.name} ${template.use} ${template.size}`.toLowerCase().includes(search);
    const matchesUse = state.filters.use === "all" || template.use === state.filters.use;
    const matchesSize = state.filters.size === "all" || template.size === state.filters.size;
    const matchesStatus = state.filters.status === "all" || template.status === state.filters.status;
    return matchesSearch && matchesUse && matchesSize && matchesStatus;
  });
}

function renderTemplatePanel() {
  const uses = [...new Set(fakeData.templates.map((template) => template.use))];
  const sizes = [...new Set(fakeData.templates.map((template) => template.size))];
  const templates = filteredTemplates();
  qs('[data-tool-panel="templates"]').innerHTML = `
    <div class="filter-grid">
      <label class="field">
        <span>搜尋模板</span>
        <input type="search" value="${state.filters.search}" placeholder="輸入用途、尺寸或名稱" data-template-search />
      </label>
      <label class="field">
        <span>用途</span>
        <select data-filter-use>
          <option value="all">全部用途</option>
          ${uses.map((use) => `<option value="${use}" ${state.filters.use === use ? "selected" : ""}>${use}</option>`).join("")}
        </select>
      </label>
      <label class="field">
        <span>尺寸</span>
        <select data-filter-size>
          <option value="all">全部尺寸</option>
          ${sizes.map((size) => `<option value="${size}" ${state.filters.size === size ? "selected" : ""}>${size}</option>`).join("")}
        </select>
      </label>
      <div class="filter-row" role="group" aria-label="模板狀態">
        <button class="filter-chip ${state.filters.status === "all" ? "is-active" : ""}" type="button" data-filter-status="all">全部</button>
        <button class="filter-chip ${state.filters.status === "active" ? "is-active" : ""}" type="button" data-filter-status="active">可用</button>
        <button class="filter-chip ${state.filters.status === "review" ? "is-active" : ""}" type="button" data-filter-status="review">待確認</button>
      </div>
    </div>
    <div data-template-results>
      ${renderTemplateResults()}
    </div>
  `;
}

function renderTemplateResults() {
  const templates = filteredTemplates();
  return `
    <div class="template-list">
      ${
        templates.length
          ? templates.map((template) => renderTemplateCard(template)).join("")
          : `<article class="data-card"><strong>沒有符合的模板</strong><p>請調整搜尋或篩選條件。</p></article>`
      }
    </div>
  `;
}

function renderTemplateCard(template) {
  const selected = template.id === state.selectedTemplateId ? "is-selected" : "";
  const thumbClass = template.thumbnailType === "square" ? "square" : template.thumbnailType === "wide" ? "wide" : "";
  return `
    <button class="template-card ${selected}" type="button" data-template-id="${template.id}">
      <span class="template-thumb ${thumbClass}">${template.size}</span>
      <span>
        <strong>${template.name}</strong>
        <p>${template.use} · ${template.version}</p>
        <span class="template-tags">
          ${statusBadge(template.status, template.status === "active" ? "可用" : "待確認")}
          <span class="status-pill">${template.completeness}% 完整</span>
          <span class="status-pill">${template.slotCount} 欄位</span>
        </span>
      </span>
    </button>
  `;
}

function renderDataPanel() {
  qs('[data-tool-panel="data"]').innerHTML = `
    <article class="data-card">
      <strong>${state.uploaded ? "Demo 資料已匯入" : "尚未匯入資料"}</strong>
      <p>${state.uploaded ? "已讀取 3 筆物件資料，可切換預覽。" : "按下假匯入會顯示資料表預覽，不會讀取真實檔案。"}</p>
      <div class="card-actions">
        <button class="btn btn-primary" type="button" data-fake-upload>假匯入物件資料</button>
      </div>
    </article>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>物件</th>
            <th>區域</th>
            <th>售價</th>
            <th>坪數</th>
          </tr>
        </thead>
        <tbody>
          ${fakeData.propertyRows.map((row, index) => `
            <tr>
              <td><button class="btn btn-ghost" type="button" data-record-index="${index}">${row.name}</button></td>
              <td>${row.location}</td>
              <td>${row.price}</td>
              <td>${row.size}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <div class="mobile-data-list">
      ${fakeData.propertyRows.map((row, index) => `
        <article class="data-card">
          <strong>${row.name}</strong>
          <p>${row.location} · ${row.price} · ${row.size}</p>
          <button class="btn btn-secondary" type="button" data-record-index="${index}">預覽這筆</button>
        </article>
      `).join("")}
    </div>
  `;
}

function renderFieldPanel() {
  qs('[data-tool-panel="fields"]').innerHTML = `
    <article class="data-card">
      <strong>AI 欄位判定只做對應建議</strong>
      <p>可手動修正對應，但只能選白名單槽位。</p>
    </article>
    <div class="field-list">
      ${fakeData.fieldMatches.map((match) => `
        <article class="field-card">
          <strong>${match.source}</strong>
          <p>建議對應：${match.target}</p>
          <div class="template-tags">
            <span class="confidence-chip ${confidenceClass(match.confidence)}">${match.confidence}</span>
            ${statusBadge(match.status, match.status === "review" ? "待確認" : "已對應")}
          </div>
          <label class="field">
            <span>手動修正</span>
            <select data-match-id="${match.id}">
              ${fakeData.slotOptions.map((slot) => `<option value="${slot}" ${slot === match.target ? "selected" : ""}>${slot}</option>`).join("")}
            </select>
          </label>
        </article>
      `).join("")}
    </div>
  `;
}

function renderBrandPanel() {
  qs('[data-tool-panel="brand"]').innerHTML = `
    <article class="brand-card">
      <strong>吉富品牌工具組</strong>
      <p>品牌元素集中管理，模板套版時自動套用。</p>
      <div class="swatch-row">
        ${fakeData.brandKit.colors.map((color) => `<span class="swatch" style="background:${color}">${color}</span>`).join("")}
      </div>
    </article>
    <article class="brand-card">
      <strong>字型</strong>
      <p>${fakeData.brandKit.fonts.join(" / ")}</p>
    </article>
    <div class="brand-list">
      ${fakeData.brandKit.restrictions.map((item) => `
        <article class="brand-card">
          <strong>${item}</strong>
          <p>由模板鎖定層保護。</p>
        </article>
      `).join("")}
    </div>
  `;
}

function renderExportPanel() {
  qs('[data-tool-panel="export"]').innerHTML = `
    <div class="export-list">
      ${fakeData.outputChecks.map((check) => `
        <article class="export-card">
          <strong>${check.label}</strong>
          <p>${check.detail}</p>
          ${statusBadge(check.status, check.status === "pass" ? "通過" : "需確認")}
        </article>
      `).join("")}
      <article class="export-card">
        <strong>輸出格式</strong>
        <p>A4 PDF、社群 PNG、LINE 圖文尺寸目前為假流程。</p>
        <div class="card-actions">
          <button class="btn btn-primary" type="button" data-fake-download>假下載目前預覽</button>
          <button class="btn btn-secondary" type="button" data-fake-download>假批次下載</button>
        </div>
      </article>
    </div>
  `;
}

function renderToolPanels() {
  renderTemplatePanel();
  renderDataPanel();
  renderFieldPanel();
  renderBrandPanel();
  renderExportPanel();
  setTool(state.activeTool, false);
}

function renderRecordStrip() {
  qs("[data-record-strip]").innerHTML = fakeData.propertyRows
    .map((row, index) => `
      <button class="record-chip ${index === state.selectedPropertyIndex ? "is-active" : ""}" type="button" data-record-index="${index}">
        ${index + 1}. ${row.name}
      </button>
    `)
    .join("");
}

function renderCanvas() {
  const template = selectedTemplate();
  const row = selectedProperty();
  const artboard = qs("[data-artboard]");
  artboard.className = `artboard ${template.artboardClass}`;
  artboard.style.setProperty("--artboard-zoom", state.zoom / 100);
  qs("[data-selected-template]").textContent = template.name;
  qs("[data-selected-size]").textContent = `${template.size} · ${template.version}`;
  qs("[data-zoom-label]").textContent = `${state.zoom}%`;
  qs("[data-preview-image]").textContent = row.image;
  qs("[data-preview-location]").textContent = row.location;
  qs("[data-preview-title]").textContent = row.name;
  qs("[data-preview-summary]").textContent = row.summary;
  qs("[data-preview-bed]").textContent = row.beds;
  qs("[data-preview-size]").textContent = row.size;
  qs("[data-preview-type]").textContent = row.type;
  qs("[data-preview-price]").textContent = row.price;
  qs("[data-preview-agent]").textContent = row.agent;
}

function renderInspector() {
  const template = selectedTemplate();
  qs("[data-template-meta]").innerHTML = `
    <dt>名稱</dt><dd>${template.name}</dd>
    <dt>用途</dt><dd>${template.use}</dd>
    <dt>尺寸</dt><dd>${template.size}</dd>
    <dt>版本</dt><dd>${template.version}</dd>
    <dt>欄位數</dt><dd>${template.slotCount}</dd>
    <dt>完整度</dt><dd>${template.completeness}%</dd>
  `;
  qs("[data-match-score]").textContent = `${Math.round(fakeData.fieldMatches.filter((match) => match.status !== "review").length / fakeData.fieldMatches.length * 100)}%`;
  qs("[data-inspector-matches]").innerHTML = fakeData.fieldMatches
    .map((match) => `
      <article class="inspector-line">
        <span><strong>${match.source}</strong>${match.target}</span>
        <span class="confidence-chip ${confidenceClass(match.confidence)}">${match.confidence}</span>
      </article>
    `)
    .join("");
  qs("[data-locked-layers]").innerHTML = template.lockedLayers
    .map((layer) => `
      <article class="inspector-line">
        <span><strong>${layer}</strong>已鎖定</span>
        ${statusBadge("pass", "Lock")}
      </article>
    `)
    .join("");
  qs("[data-output-checks]").innerHTML = fakeData.outputChecks
    .map((check) => `
      <article class="check-item">
        <span><strong>${check.label}</strong>${check.detail}</span>
        ${statusBadge(check.status, check.status === "pass" ? "OK" : "Review")}
      </article>
    `)
    .join("");
}

function renderAdmin() {
  qs("[data-admin-template-table]").innerHTML = fakeData.templates
    .map((template) => `
      <tr>
        <td><strong>${template.name}</strong></td>
        <td>${template.use}</td>
        <td>${template.size}</td>
        <td>${template.version}</td>
        <td>${template.slotCount}</td>
        <td>${statusBadge(template.status, template.status === "active" ? "可用" : "待確認")}</td>
      </tr>
    `)
    .join("");
  qs("[data-admin-slots]").innerHTML = fakeData.slotOptions
    .map((slot) => `<article class="rule-pill"><strong>${slot}</strong><span>允許資料套入，需通過欄位白名單。</span></article>`)
    .join("");
  qs("[data-admin-locked]").innerHTML = fakeData.brandKit.restrictions
    .map((item) => `<article class="rule-pill"><strong>${item}</strong><span>套版時不可被一般使用者變更。</span></article>`)
    .join("");
  qs("[data-admin-checks]").innerHTML = fakeData.outputChecks
    .map((check) => `
      <article class="preflight-card">
        <strong>${check.label}</strong>
        <p>${check.detail}</p>
        ${statusBadge(check.status, check.status === "pass" ? "通過" : "需確認")}
      </article>
    `)
    .join("");
}

function renderAll() {
  renderToolPanels();
  renderRecordStrip();
  renderCanvas();
  renderInspector();
  renderAdmin();
}

function fakeUpload(button) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "讀取中";
  showToast("正在模擬讀取 3 筆物件資料。");
  window.setTimeout(() => {
    state.uploaded = true;
    button.disabled = false;
    button.textContent = original;
    renderDataPanel();
    setTool("data", true);
    showToast("假匯入完成：資料表預覽已更新。");
  }, 800);
}

function fakeDownload(button) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "準備中";
  showToast("正在模擬輸出檢查。");
  window.setTimeout(() => {
    button.disabled = false;
    button.textContent = original;
    showToast("假下載完成：Demo 不會產生真實檔案。");
  }, 800);
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const spaceButton = event.target.closest("[data-space-switch]");
    if (spaceButton) {
      setSpace(spaceButton.dataset.spaceSwitch);
      return;
    }

    const toolButton = event.target.closest("[data-tool]");
    if (toolButton) {
      setTool(toolButton.dataset.tool, true);
      return;
    }

    const mobileTool = event.target.closest("[data-mobile-tool]");
    if (mobileTool) {
      setSpace("front");
      setTool(mobileTool.dataset.mobileTool, true);
      return;
    }

    const templateButton = event.target.closest("[data-template-id]");
    if (templateButton) {
      state.selectedTemplateId = templateButton.dataset.templateId;
      renderTemplatePanel();
      renderCanvas();
      renderInspector();
      showToast(`已切換模板：${selectedTemplate().name}`);
      return;
    }

    const recordButton = event.target.closest("[data-record-index]");
    if (recordButton) {
      state.selectedPropertyIndex = Number(recordButton.dataset.recordIndex);
      renderRecordStrip();
      renderCanvas();
      showToast(`正在預覽：${selectedProperty().name}`);
      return;
    }

    const statusButton = event.target.closest("[data-filter-status]");
    if (statusButton) {
      state.filters.status = statusButton.dataset.filterStatus;
      renderTemplatePanel();
      return;
    }

    const zoomButton = event.target.closest("[data-zoom]");
    if (zoomButton) {
      state.zoom = Math.min(112, Math.max(68, state.zoom + (zoomButton.dataset.zoom === "in" ? 6 : -6)));
      renderCanvas();
      return;
    }

    const modalButton = event.target.closest("[data-open-modal]");
    if (modalButton) {
      openModal(modalButton.dataset.openModal);
      return;
    }

    if (event.target.closest("[data-modal-close]")) {
      closeModal();
      return;
    }

    if (event.target.closest("[data-modal-confirm]")) {
      closeModal();
      showToast("Demo 已確認，正式儲存會在下一階段處理。");
      return;
    }

    const toastButton = event.target.closest("[data-toast]");
    if (toastButton) {
      showToast(toastButton.dataset.toast);
      return;
    }

    const uploadButton = event.target.closest("[data-fake-upload]");
    if (uploadButton) {
      fakeUpload(uploadButton);
      return;
    }

    const downloadButton = event.target.closest("[data-fake-download]");
    if (downloadButton) {
      fakeDownload(downloadButton);
      return;
    }

    if (event.target.closest("[data-line-menu-toggle]")) {
      openLineMenu();
      return;
    }

    if (event.target.closest("[data-line-menu-close]")) {
      closeLineMenu();
      return;
    }

    if (event.target.matches("[data-line-menu]")) {
      closeLineMenu();
      return;
    }

    if (event.target.closest("[data-close-panel]")) {
      qs("[data-asset-panel]").classList.remove("is-open");
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.matches("[data-template-search]")) {
      state.filters.search = event.target.value;
      const results = qs("[data-template-results]");
      if (results) {
        results.innerHTML = renderTemplateResults();
      }
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-filter-use]")) {
      state.filters.use = event.target.value;
      renderTemplatePanel();
      return;
    }

    if (event.target.matches("[data-filter-size]")) {
      state.filters.size = event.target.value;
      renderTemplatePanel();
      return;
    }

    if (event.target.matches("[data-match-id]")) {
      const match = fakeData.fieldMatches.find((item) => item.id === event.target.dataset.matchId);
      if (match) {
        match.target = event.target.value;
        match.status = "matched";
        match.confidence = match.confidence === "待確認" ? "中" : match.confidence;
        renderFieldPanel();
        renderInspector();
        showToast(`${match.source} 已改對應到 ${match.target}`);
      }
    }
  });

  qs("[data-modal]").addEventListener("click", (event) => {
    if (event.target.matches("[data-modal]")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      closeLineMenu();
      if (isMobileWidth()) {
        qs("[data-asset-panel]").classList.remove("is-open");
      }
    }
  });
}

function init() {
  renderAll();
  setSpace("front");
  setTool("templates", false);
  bindEvents();
}

init();
