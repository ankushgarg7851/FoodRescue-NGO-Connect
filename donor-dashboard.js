const donationForm = document.getElementById("donation-form");
const message = document.getElementById("form-message");
const submitButton = document.getElementById("submit-button");
const donationsTable = document.getElementById("donations-table");

// Get the logged-in user's details from localStorage
function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("loggedInUser")) || {};
  } catch (error) {
    console.error("Could not read logged-in user:", error);
    return {};
  }
}

const currentUser = getLoggedInUser();

const welcomeEl = document.getElementById("welcome-user");
if (welcomeEl) {
  welcomeEl.textContent = `Welcome, ${currentUser.name || "Donor"}!`;
}

// Display messages
function showMessage(text, isError = false) {
  if (!message) return;
  message.textContent = text;
  message.style.color = isError ? "#B91C1C" : "#146C65";
  message.style.fontWeight = "600";
}

// Escape HTML
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// Read JSON response safely
async function readJSONResponse(response) {
  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(`Server returned status HTTP ${response.status}. Check backend terminal.`);
  }
  if (!response.ok) {
    throw new Error(result.error || result.details || "The server request failed.");
  }
  return result;
}

// ========================================================
// PARAMETER 1: FETCH & DISPLAY EXTERNAL WEATHER ADVISORY
// ========================================================
async function loadWeatherAdvisory() {
  const card = document.getElementById("weather-advisory-card");
  const tempEl = document.getElementById("weather-temp");
  const descEl = document.getElementById("weather-desc");
  const badgeEl = document.getElementById("weather-risk-badge");

  if (!card) return;

  try {
    const res = await fetch("/api/external/weather-advisory");
    const data = await readJSONResponse(res);

    if (data && data.weather && data.foodSafetyAdvisory) {
      card.style.display = "block";
      tempEl.textContent = `🌡️ ${data.location}: ${data.weather.temperatureC}°C (${data.weather.condition})`;
      descEl.textContent = `Advisory: ${data.foodSafetyAdvisory.advisory} (Safe Window: ${data.foodSafetyAdvisory.safeWindowHours} hrs)`;
      badgeEl.textContent = `Risk Level: ${data.foodSafetyAdvisory.riskLevel}`;

      if (data.foodSafetyAdvisory.riskLevel === "High") {
        card.style.background = "#FEF2F2";
        card.style.borderColor = "#F87171";
        badgeEl.style.background = "#FEE2E2";
        badgeEl.style.color = "#991B1B";
        badgeEl.style.borderColor = "#F87171";
      } else if (data.foodSafetyAdvisory.riskLevel === "Moderate") {
        card.style.background = "#FFFBEB";
        card.style.borderColor = "#FDE68A";
        badgeEl.style.background = "#FEF3C7";
        badgeEl.style.color = "#92400E";
      } else {
        card.style.background = "#ECFDF5";
        card.style.borderColor = "#A7F3D0";
        badgeEl.style.background = "#D1FAE5";
        badgeEl.style.color = "#065F46";
      }
    }
  } catch (err) {
    console.warn("Could not load external weather advisory:", err.message);
  }
}

// ========================================================
// PARAMETER 2, 3, 4: LOAD DONATIONS & CRUD OPERATIONS
// ========================================================
async function loadDonations() {
  try {
    const response = await fetch("/api/donations", { cache: "no-store" });
    const allDonations = await readJSONResponse(response);

    if (!Array.isArray(allDonations)) {
      throw new Error("The donations API did not return an array list.");
    }

    const email = (currentUser.email || "").toLowerCase();

    // If logged in, show this donor's donations; if guest, show all for demo
    const myDonations = email
      ? allDonations.filter(d => (d.donorEmail || "").toLowerCase() === email)
      : allDonations;

    // Metrics
    const totalDonationsEl = document.getElementById("total-donations");
    const totalMealsEl = document.getElementById("total-meals");
    const activePickupsEl = document.getElementById("active-pickups");

    if (totalDonationsEl) totalDonationsEl.textContent = myDonations.length;
    if (totalMealsEl) {
      const totalMeals = myDonations.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
      totalMealsEl.textContent = totalMeals.toLocaleString("en-IN");
    }
    if (activePickupsEl) {
      const activeCount = myDonations.filter(d => !["Delivered", "Cancelled"].includes(d.status)).length;
      activePickupsEl.textContent = activeCount;
    }

    if (!donationsTable) return;

    if (myDonations.length === 0) {
      donationsTable.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px; color: #64748B;">No donations submitted yet. Use the form above to add your first food donation!</td></tr>';
      return;
    }

    // Render rows with CRUD Actions (Track, Edit, Delete)
    donationsTable.innerHTML = myDonations
      .slice()
      .map(donation => {
        const id = donation.id || donation._id;
        const status = donation.status || "Available";
        const isEditable = !["Delivered", "Cancelled"].includes(status);

        let statusStyle = "background: #DEF4F0; color: #146C65;";
        if (status === "Confirmed") statusStyle = "background: #E0E7FF; color: #3730A3;";
        if (status === "En Route") statusStyle = "background: #FEF3C7; color: #92400E;";
        if (status === "Delivered") statusStyle = "background: #D1FAE5; color: #065F46;";
        if (status === "Cancelled") statusStyle = "background: #FEE2E2; color: #991B1B;";

        return `
          <tr>
            <td><strong>${escapeHTML(id)}</strong></td>
            <td>${escapeHTML(donation.foodName)}<br><small style="color:#64748B;">${escapeHTML(donation.foodType)}</small></td>
            <td><strong>${Number(donation.quantity || 0).toLocaleString("en-IN")}</strong> servings</td>
            <td><span style="padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 11px; ${statusStyle}">${escapeHTML(status)}</span></td>
            <td><a href="Track.html?id=${encodeURIComponent(id)}" class="track-link" style="color: #146C65; font-weight:700; text-decoration:none;">Track &rarr;</a></td>
            <td>
              <div style="display:flex; gap: 8px;">
                ${isEditable ? `<button type="button" onclick="editDonation('${escapeHTML(id)}')" style="background:none; border:1px solid #CBD5E1; border-radius:6px; padding:4px 8px; font-size:12px; cursor:pointer; color:#1E293B;">Edit</button>` : ""}
                <button type="button" onclick="deleteDonation('${escapeHTML(id)}')" style="background:none; border:1px solid #FCA5A5; border-radius:6px; padding:4px 8px; font-size:12px; cursor:pointer; color:#B91C1C;">Delete</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Load donations error:", error);
    if (donationsTable) {
      donationsTable.innerHTML =
        '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #B91C1C;">Unable to load donations. Check the server connection and refresh.</td></tr>';
    }
  }
}

// ========================================================
// CRUD: CREATE DONATION (POST /api/donations)
// ========================================================
if (donationForm) {
  donationForm.addEventListener("submit", async event => {
    event.preventDefault();

    const foodName = document.getElementById("food-name").value.trim();
    const foodType = document.getElementById("food-type").value;
    const quantity = Number(document.getElementById("quantity").value);
    const pickupDate = document.getElementById("pickup-window").value;
    const pickupLocation = document.getElementById("pickup-location").value.trim();
    const notes = document.getElementById("additional-notes").value.trim();

    if (!foodName || !foodType || !pickupLocation) {
      showMessage("Please complete all required fields.", true);
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      showMessage("Enter a valid quantity of at least 1 serving.", true);
      return;
    }

    const pickupTimestamp = new Date(pickupDate).getTime();
    if (!pickupDate || !Number.isFinite(pickupTimestamp)) {
      showMessage("Please select a valid pickup date and time.", true);
      return;
    }

    const email = currentUser.email || "donor@foodrescue.org";
    const name = currentUser.name || "Food Donor";

    const donation = {
      foodName,
      foodType,
      quantity,
      pickupWindow: pickupDate,
      pickupLocation,
      notes,
      donorName: name,
      donorEmail: email
    };

    submitButton.disabled = true;
    submitButton.textContent = "Saving to Database...";
    showMessage("Saving your food donation...");

    try {
      const response = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donation)
      });

      const result = await readJSONResponse(response);
      console.log("Donation saved successfully:", result.donation);

      showMessage("Donation saved successfully! Redirecting to live tracking...");
      donationForm.reset();
      await loadDonations();

      const newId = result.donation.id || result.donation._id;
      setTimeout(() => {
        if (confirm("Donation saved! Would you like to view live tracking now?")) {
          window.location.href = `Track.html?id=${encodeURIComponent(newId)}`;
        }
      }, 500);
    } catch (error) {
      console.error("Submit donation error:", error);
      showMessage(error.message || "Failed to save donation.", true);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Submit Donation & Track";
    }
  });
}

// ========================================================
// CRUD: EDIT DONATION (PUT /api/donations/:id)
// ========================================================
window.editDonation = async function (id) {
  try {
    const res = await fetch(`/api/donations/${encodeURIComponent(id)}`);
    const donation = await readJSONResponse(res);

    const newFoodName = prompt("Update Food Description:", donation.foodName);
    if (newFoodName === null) return;

    const newQtyStr = prompt("Update Quantity (servings):", donation.quantity);
    if (newQtyStr === null) return;
    const newQty = Number(newQtyStr);
    if (!Number.isInteger(newQty) || newQty < 1) {
      alert("Invalid quantity. Must be an integer of at least 1.");
      return;
    }

    const newNotes = prompt("Update Notes / Allergens:", donation.notes || "");
    if (newNotes === null) return;

    const updateRes = await fetch(`/api/donations/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        foodName: newFoodName.trim(),
        quantity: newQty,
        notes: newNotes.trim()
      })
    });

    await readJSONResponse(updateRes);
    alert("Donation updated successfully!");
    await loadDonations();
  } catch (err) {
    alert("Update failed: " + err.message);
  }
};

// ========================================================
// CRUD: DELETE DONATION (DELETE /api/donations/:id)
// ========================================================
window.deleteDonation = async function (id) {
  if (!confirm(`Are you sure you want to delete/cancel donation #${id}?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/donations/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });

    await readJSONResponse(res);
    alert(`Donation #${id} deleted successfully.`);
    await loadDonations();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
};

// Initialize
loadWeatherAdvisory();
loadDonations();
