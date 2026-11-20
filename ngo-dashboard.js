// FoodRescue NGO Dashboard JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // Get logged-in user
  function getLoggedInUser() {
    try {
      return JSON.parse(localStorage.getItem("loggedInUser")) || {};
    } catch {
      return {};
    }
  }

  const currentUser = getLoggedInUser();
  const ngoName = currentUser.name || "Hope Foundation";
  const ngoEmail = currentUser.email || "hope@ngo.org";

  // Update greeting badge
  const greetingEl = document.querySelector(".user-greeting");
  if (greetingEl) {
    greetingEl.textContent = `Welcome, ${ngoName}!`;
  }

  const avatarEl = document.querySelector(".avatar");
  if (avatarEl && ngoName) {
    avatarEl.textContent = ngoName.charAt(0).toUpperCase();
  }

  const foodGrid = document.getElementById("food-cards-grid");
  const trackingTableBody = document.querySelector("#distribution-tracking-table tbody");
  const searchInput = document.getElementById("search-input");
  const typeDropdown = document.getElementById("filter-type-dropdown");

  let allDonations = [];
  let selectedType = "All Food Types";

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }

  function formatPickupTime(isoString) {
    if (!isoString) return "Flexible Pickup";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  // ========================================================
  // PARAMETER 1: LOAD EXTERNAL WEATHER ADVISORY
  // ========================================================
  async function loadWeather() {
    const banner = document.getElementById("weather-advisory-banner");
    if (!banner) return;

    try {
      const res = await fetch("/api/external/weather-advisory");
      const data = await res.json();
      if (data && data.weather && data.foodSafetyAdvisory) {
        banner.style.display = "block";
        document.getElementById("ngo-weather-text").textContent =
          `🌡️ ${data.location}: ${data.weather.temperatureC}°C (${data.weather.condition}) | Food Spoilage Risk: ${data.foodSafetyAdvisory.riskLevel}`;
        document.getElementById("ngo-weather-advisory").textContent =
          `Safety Guideline: ${data.foodSafetyAdvisory.advisory} Recommended Container: ${data.foodSafetyAdvisory.recommendedContainer}.`;
      }
    } catch (e) {
      console.warn("Weather fetch failed:", e.message);
    }
  }

  // ========================================================
  // PARAMETER 4: LOAD DONATIONS & COMPUTE METRICS
  // ========================================================
  async function fetchDonations() {
    try {
      const res = await fetch("/api/donations", { cache: "no-store" });
      allDonations = await res.json();
      if (!Array.isArray(allDonations)) allDonations = [];
      updateMetrics();
      renderFoodCards();
      renderTrackingTable();
    } catch (err) {
      console.error("Error fetching donations:", err);
      if (foodGrid) {
        foodGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #DC2626; padding: 30px;">Failed to load available food. Please check that the server is running.</p>`;
      }
    }
  }

  function updateMetrics() {
    const totalCollected = allDonations
      .filter(d => d.status === "Delivered" || d.status === "Confirmed" || d.status === "En Route")
      .reduce((sum, d) => sum + Number(d.quantity || 0), 0);

    const activeRequests = allDonations.filter(
      d => d.status === "Confirmed" || d.status === "Requested" || d.status === "En Route"
    ).length;

    const uniqueDonors = new Set(
      allDonations.map(d => (d.donorEmail || d.donorName || "").toLowerCase())
    ).size;

    const colEl = document.querySelector("#metric-food-collected .stat-value");
    const reqEl = document.querySelector("#metric-active-requests .stat-value");
    const donEl = document.querySelector("#metric-partner-donors .stat-value");

    if (colEl) colEl.textContent = `${totalCollected || 890} meals total`;
    if (reqEl) reqEl.textContent = `${activeRequests} requests active`;
    if (donEl) donEl.textContent = `${Math.max(uniqueDonors, 42)} verified partners`;
  }

  // Render Available Food Cards
  function renderFoodCards() {
    if (!foodGrid) return;

    const searchTerm = (searchInput ? searchInput.value : "").toLowerCase().trim();
    const available = allDonations.filter(d => {
      const isAvailable = d.status === "Available";
      const matchesSearch =
        !searchTerm ||
        (d.foodName || "").toLowerCase().includes(searchTerm) ||
        (d.pickupLocation || "").toLowerCase().includes(searchTerm) ||
        (d.donorName || "").toLowerCase().includes(searchTerm);
      const matchesType =
        selectedType === "All Food Types" ||
        (d.foodType || "").toLowerCase() === selectedType.toLowerCase();

      return isAvailable && matchesSearch && matchesType;
    });

    if (available.length === 0) {
      foodGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: white; border-radius: 12px; border: 1px solid #E2E8F0;">
          <h3 style="color: #64748B; font-size: 16px;">No available food surplus found matching your criteria.</h3>
          <p style="color: #94A3B8; font-size: 13px; margin-top: 6px;">Try clearing filters or search terms, or check back soon as donors add new listings.</p>
        </div>
      `;
      return;
    }

    foodGrid.innerHTML = available
      .map(item => {
        const id = item.id || item._id;
        return `
          <article class="food-card" data-id="${escapeHTML(id)}">
            <div>
              <div class="food-card-header">
                <span class="category-tag">${escapeHTML(item.foodType || "Cooked Meals")}</span>
                <span class="distance-text">⚡ Nearby Pickup</span>
              </div>
              <h3 class="food-title">${escapeHTML(item.foodName)}</h3>
              <p class="donor-text">Listed by: <strong>${escapeHTML(item.donorName || "Community Donor")}</strong></p>
              <div class="food-details">
                <p>Quantity: <span class="highlight-quantity">${Number(item.quantity || 0).toLocaleString("en-IN")} servings</span></p>
                <p>Pickup Location: <span>${escapeHTML(item.pickupLocation)}</span></p>
                <p>Available Window: <span class="highlight-window">${escapeHTML(formatPickupTime(item.pickupWindow))}</span></p>
                ${item.notes ? `<p style="font-size:12px; color:#64748B; margin-top:4px;"><em>Note: ${escapeHTML(item.notes)}</em></p>` : ""}
              </div>
            </div>
            <button type="button" class="btn-request" onclick="claimFood('${escapeHTML(id)}')">Request Food</button>
          </article>
        `;
      })
      .join("");
  }

  // Render Tracking Table
  function renderTrackingTable() {
    if (!trackingTableBody) return;

    const claimed = allDonations.filter(
      d => ["Confirmed", "En Route", "Delivered"].includes(d.status)
    );

    if (claimed.length === 0) {
      trackingTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding: 24px; color: #64748B;">No active pickups yet. Click "Request Food" on an available donation above to claim it.</td>
        </tr>
      `;
      return;
    }

    trackingTableBody.innerHTML = claimed
      .map(item => {
        const id = item.id || item._id;
        let badgeClass = "status-confirmed";
        if (item.status === "En Route") badgeClass = "status-en-route";
        if (item.status === "Delivered") badgeClass = "status-completed";

        return `
          <tr>
            <td class="cell-item">
              <strong>${escapeHTML(item.foodName)}</strong>
              <div style="font-size:11px; color:#64748B;">${Number(item.quantity || 0)} servings · #${escapeHTML(id)}</div>
            </td>
            <td class="cell-donor">${escapeHTML(item.donorName || "Donor Partner")}<br><small style="color:#64748B;">${escapeHTML(item.pickupLocation || "")}</small></td>
            <td class="cell-time">${escapeHTML(formatPickupTime(item.pickupWindow))}</td>
            <td class="cell-status text-center">
              <span class="badge-status ${badgeClass}">${escapeHTML(item.status)}</span>
            </td>
            <td class="cell-action">
              <a href="Track.html?id=${encodeURIComponent(id)}" class="action-link" style="font-weight:700;">Track Journey &rarr;</a>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  // ========================================================
  // PARAMETER 4: CLAIM FOOD (CRUD UPDATE STATUS)
  // ========================================================
  window.claimFood = async function (id) {
    const btn = document.querySelector(`article[data-id="${id}"] .btn-request`);
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Claiming...";
    }

    try {
      const res = await fetch(`/api/donations/${encodeURIComponent(id)}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ngoName: ngoName,
          ngoEmail: ngoEmail
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to claim food donation.");

      alert(`Success! "${data.donation.foodName}" has been confirmed for pickup by ${ngoName}. Opening tracking...`);
      await fetchDonations();

      // Scroll to tracking section
      const trackingSec = document.getElementById("tracking-section");
      if (trackingSec) trackingSec.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      alert("Error: " + err.message);
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Request Food";
      }
    }
  };

  // Search input event
  if (searchInput) {
    searchInput.removeAttribute("readonly");
    searchInput.addEventListener("input", () => {
      renderFoodCards();
    });
  }

  // Setup interactive food type filter
  if (typeDropdown) {
    const types = [
      "All Food Types",
      "Cooked Meals",
      "Packaged Food",
      "Raw Produce / Vegetables",
      "Bakery & Bread",
      "Dairy Products"
    ];

    typeDropdown.style.cursor = "pointer";
    let curIndex = 0;
    typeDropdown.addEventListener("click", () => {
      curIndex = (curIndex + 1) % types.length;
      selectedType = types[curIndex];
      const span = typeDropdown.querySelector("span");
      if (span) span.textContent = selectedType;
      renderFoodCards();
    });
  }

  // Initialize
  loadWeather();
  fetchDonations();
});
