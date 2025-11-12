let data = {};

// Load JSON data
fetch('data.json')
  .then(response => response.json())
  .then(json => {
    data = json;
    renderBuildingList();
  })
  .catch(err => console.error("Error loading data.json:", err));

// Render building list with categories and subcategories
function renderBuildingList() {
  const buildingList = document.getElementById('building-list');
  buildingList.innerHTML = '';

  for (let category in data.buildings) {
    buildingList.innerHTML += `<h2>${category.toUpperCase()}</h2>`;
    for (let building in data.buildings[category]) {
      const info = data.buildings[category][building];

      let html = `<div class="building-block"><h3>${building}</h3>`;
      html += `<p><strong>Construction Cost:</strong> ${formatObject(info.constructionCost)}</p>`;
      html += `<p><strong>Consumes:</strong> ${formatObject(info.consumes || info.inputs)}</p>`;
      html += `<p><strong>Produces:</strong> ${formatObject(info.produces || info.outputs)}</p>`;
      html += `<p><strong>Workers:</strong> ${info.workers}</p>`;
      html += `<label>Quantity: <input type="number" id="${building}" value="0" min="0"></label></div><hr>`;

      buildingList.innerHTML += html;
    }
  }
}

// Helper to format objects
function formatObject(obj) {
  if (!obj) return 'None';
  return Object.entries(obj).map(([key, val]) => `${key}: ${val}`).join(', ');
}

// Sandbox mode: Add custom building
function addCustomBuilding() {
  const name = document.getElementById('custom-name').value.trim();
  const resourcesInput = document.getElementById('custom-resources').value.trim();
  if (!name || !resourcesInput) {
    alert("Please enter both name and resources.");
    return;
  }

  const resources = {};
  resourcesInput.split(',').forEach(pair => {
    const [res, amt] = pair.split(':');
    if (res && amt) resources[res.trim()] = parseInt(amt.trim());
  });

  // Add custom building under a "custom" category
  if (!data.buildings.custom) data.buildings.custom = {};
  data.buildings.custom[name] = {
    constructionCost: resources,
    consumes: null,
    produces: null,
    workers: 0
  };

  renderBuildingList(); // Refresh UI
  document.getElementById('custom-name').value = '';
  document.getElementById('custom-resources').value = '';
}

// Calculate resources
function calculateResources() {
  let compoundTotals = {};
  let expandedTotals = {};
  let requiredBuildings = new Set();

  // Loop through all categories and buildings
  for (let category in data.buildings) {
    for (let b in data.buildings[category]) {
      let qty = parseInt(document.getElementById(b)?.value || 0);
      if (qty > 0) {
        const costs = data.buildings[category][b].constructionCost || {};
        for (let res in costs) {
          compoundTotals[res] = (compoundTotals[res] || 0) + costs[res] * qty;
        }
      }
    }
  }

  // Expand resources and track required buildings
  for (let res in compoundTotals) {
  // If resource has breakdown, substitute and skip original
  if (data.resources[res]) {
    if (data.resources[res].requiresBuilding) {
      requiredBuildings.add(data.resources[res].requiresBuilding);
    }
    for (let base in data.resources[res]) {
      if (base !== "requiresBuilding") {
        expandedTotals[base] = (expandedTotals[base] || 0) + data.resources[res][base] * compoundTotals[res];
      }
    }
  } else {
    // If no breakdown, keep original resource
    expandedTotals[res] = (expandedTotals[res] || 0) + compoundTotals[res];
  }
}

  displayTable('compound-table', compoundTotals);
  displayTable('expanded-table', expandedTotals);
  displayRequiredBuildings(requiredBuildings);
}

// Display tables
function displayTable(id, obj) {
  const table = document.getElementById(id);
  table.innerHTML = '<tr><th>Resource</th><th>Amount</th></tr>';
  for (let key in obj) {
    table.innerHTML += `<tr><td>${key}</td><td>${obj[key]}</td></tr>`;
  }
}

function displayRequiredBuildings(buildingsSet) {
  const container = document.getElementById('required-buildings');
  container.innerHTML = '<h3>Required Special Buildings</h3>';
  if (buildingsSet.size === 0) {
    container.innerHTML += '<p>None</p>';
  } else {
    container.innerHTML += '<ul>' + [...buildingsSet].map(b => `<li>${b}</li>`).join('') + '</ul>';
  }
}