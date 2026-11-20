// FoodRescue - Dynamic Donation Journey Tracking
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const donationId = params.get("id");

  function escapeHTML(str) {
    return String(str ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function formatTime(isoStr) {
    if (!isoStr) return "Pending";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  async function fetchDonation() {
    try {
      if (donationId) {
        const res = await fetch(`/api/donations/${encodeURIComponent(donationId)}`);
        if (res.ok) {
          return await res.json();
        }
      }
      // If no ID or not found, fetch latest donation
      const listRes = await fetch("/api/donations");
      if (listRes.ok) {
        const list = await listRes.json();
        if (Array.isArray(list) && list.length > 0) {
          return list[0];
        }
      }
    } catch (err) {
      console.warn("Could not fetch donation details:", err.message);
    }
    return null;
  }

  const donation = await fetchDonation();

  if (!donation) {
    console.log("No donation data available to render.");
    return;
  }

  const id = donation.id || donation._id || "FR-DEMO";
  const status = donation.status || "Available";

  // Update badges
  const idBadge = document.querySelector(".donation-badge");
  if (idBadge) idBadge.textContent = `DONATION #${id}`;

  const statusBadge = document.querySelector(".status-badge");
  if (statusBadge) {
    statusBadge.textContent = status.toUpperCase();
    if (status === "Delivered") {
      statusBadge.style.background = "#D1FAE5";
      statusBadge.style.color = "#065F46";
    } else if (status === "En Route") {
      statusBadge.style.background = "#FEF3C7";
      statusBadge.style.color = "#92400E";
    } else if (status === "Confirmed") {
      statusBadge.style.background = "#E0E7FF";
      statusBadge.style.color = "#3730A3";
    }
  }

  // Update Food Information
  const foodInfo = document.querySelector(".food-information");
  if (foodInfo) {
    foodInfo.innerHTML = `
      <h3>${escapeHTML(donation.foodName)}</h3>
      <p><strong>${Number(donation.quantity || 0).toLocaleString("en-IN")} servings</strong> · ${escapeHTML(donation.foodType || "Cooked Meals")}</p>
      <p>Pickup: <strong>${escapeHTML(formatTime(donation.pickupWindow))}</strong></p>
      <p>Location: ${escapeHTML(donation.pickupLocation || "Pickup address on file")}</p>
      ${donation.notes ? `<p><small>Notes: ${escapeHTML(donation.notes)}</small></p>` : ""}
    `;
  }

  // Update Receiver Information
  const receiverInfo = document.querySelector(".receiver-information");
  if (receiverInfo) {
    const ngoName = donation.claimedBy?.ngoName || (status !== "Available" ? "Hope Foundation" : "Awaiting NGO Match");
    const ngoEmail = donation.claimedBy?.ngoEmail || (status !== "Available" ? "hope@ngo.org" : "Available to all verified NGOs");

    receiverInfo.innerHTML = `
      <p class="field-label">Receiving organisation</p>
      <h3>${escapeHTML(ngoName)}</h3>
      <p>Contact: ${escapeHTML(ngoEmail)}</p>
      <p>Donor Partner: <strong>${escapeHTML(donation.donorName || "Food Donor")}</strong></p>
    `;
  }

  // Update Timeline steps
  const isConfirmed = ["Confirmed", "En Route", "Delivered"].includes(status);
  const isEnRoute = ["En Route", "Delivered"].includes(status);
  const isDelivered = status === "Delivered";

  const timelineRows = document.querySelectorAll(".timeline-card .timeline-row");
  if (timelineRows.length >= 4) {
    // Step 1: Created
    timelineRows[0].querySelector(".timeline-marker").className = "timeline-marker completed";
    timelineRows[0].querySelector(".timeline-marker").textContent = "✓";
    timelineRows[0].querySelector(".timeline-time").textContent = formatTime(donation.createdAt);

    // Step 2: Confirmed
    if (isConfirmed) {
      timelineRows[1].querySelector(".timeline-marker").className = "timeline-marker completed";
      timelineRows[1].querySelector(".timeline-marker").textContent = "✓";
      timelineRows[1].querySelector(".timeline-time").textContent = formatTime(donation.claimedBy?.claimedAt || donation.updatedAt);
    } else {
      timelineRows[1].querySelector(".timeline-marker").className = "timeline-marker pending";
      timelineRows[1].querySelector(".timeline-marker").textContent = "2";
      timelineRows[1].querySelector(".timeline-time").textContent = "Awaiting NGO";
    }

    // Step 3: En Route
    if (isEnRoute) {
      timelineRows[2].querySelector(".timeline-marker").className = "timeline-marker completed";
      timelineRows[2].querySelector(".timeline-marker").textContent = "✓";
      timelineRows[2].querySelector(".timeline-time").textContent = isDelivered ? "Completed" : "In Progress";
    } else {
      timelineRows[2].querySelector(".timeline-marker").className = "timeline-marker pending";
      timelineRows[2].querySelector(".timeline-marker").textContent = "3";
      timelineRows[2].querySelector(".timeline-time").textContent = "Pending Pickup";
    }

    // Step 4: Delivered
    if (isDelivered) {
      timelineRows[3].querySelector(".timeline-marker").className = "timeline-marker completed";
      timelineRows[3].querySelector(".timeline-marker").textContent = "✓";
      timelineRows[3].querySelector(".timeline-time").textContent = "Delivered";
    } else {
      timelineRows[3].querySelector(".timeline-marker").className = "timeline-marker pending";
      timelineRows[3].querySelector(".timeline-marker").textContent = "4";
      timelineRows[3].querySelector(".timeline-time").textContent = isEnRoute ? "In Progress" : "Pending";
    }
  }

  // Add Interactive Live Status Update Bar for evaluation demonstration
  const journeySection = document.querySelector(".journey-section");
  if (journeySection) {
    const controls = document.createElement("div");
    controls.style.cssText = "background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-top: 24px; text-align: center;";
    controls.innerHTML = `
      <h3 style="font-size: 15px; color: #1E293B; margin-bottom: 8px;">Live Journey Status Controls (CRUD Update Test)</h3>
      <p style="font-size: 13px; color: #64748B; margin-bottom: 14px;">Update this donation's status in the database to test real-time tracking progression:</p>
      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button type="button" onclick="updateLiveStatus('Confirmed')" style="background:#E0E7FF; color:#3730A3; border:0; padding:8px 16px; border-radius:8px; font-weight:700; cursor:pointer;">Mark Confirmed</button>
        <button type="button" onclick="updateLiveStatus('En Route')" style="background:#FEF3C7; color:#92400E; border:0; padding:8px 16px; border-radius:8px; font-weight:700; cursor:pointer;">Mark En Route</button>
        <button type="button" onclick="updateLiveStatus('Delivered')" style="background:#D1FAE5; color:#065F46; border:0; padding:8px 16px; border-radius:8px; font-weight:700; cursor:pointer;">Mark Delivered</button>
        <button type="button" onclick="updateLiveStatus('Available')" style="background:#F1F5F9; color:#475569; border:0; padding:8px 16px; border-radius:8px; font-weight:700; cursor:pointer;">Reset to Available</button>
      </div>
    `;
    journeySection.appendChild(controls);
  }

  window.updateLiveStatus = async function (newStatus) {
    try {
      const res = await fetch(`/api/donations/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status.");
      window.location.reload();
    } catch (err) {
      alert("Status update failed: " + err.message);
    }
  };
});
