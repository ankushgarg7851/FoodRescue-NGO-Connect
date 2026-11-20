/* FoodRescue – Ratings & Reviews (MongoDB Integrated) */
(() => {
  "use strict";

  const seedReviews = [
    { id: "sample-1", name: "Aarav Mehta", ngo: "FoodRescue", rating: 5, date: "2026-10-14", text: "The team communicated clearly and coordinated the food collection smoothly. It was reassuring to know the surplus meals could reach families who needed them.", sample: true },
    { id: "sample-2", name: "Priya Sharma", ngo: "FoodRescue", rating: 5, date: "2026-10-08", text: "A meaningful initiative. The volunteers were kind, organised, and careful about distributing the food promptly. I would like to support similar drives again.", sample: true },
    { id: "sample-3", name: "Rohan Gupta", ngo: "FoodRescue", rating: 4, date: "2026-09-29", text: "The pickup process was straightforward and the team was responsive. Sharing collection updates a little more frequently would make the experience even better.", sample: true },
    { id: "sample-4", name: "Nisha Verma", ngo: "FoodRescue", rating: 5, date: "2026-09-17", text: "I appreciated the friendly coordination and the focus on reducing food waste. The platform makes it easier to connect a donation with a local cause.", sample: true }
  ];

  const STORAGE_KEY = "foodrescue-community-reviews-v1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  let activeRating = "all";
  let selectedStars = 0;
  let reviews = [];

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
  }

  function formatDate(date) {
    if (!date) return "Recently";
    const parsed = new Date(date.length === 10 ? date + "T12:00:00" : date);
    return Number.isNaN(parsed.getTime())
      ? "Recently"
      : parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  function starString(value) {
    const v = Math.max(1, Math.min(5, Math.round(Number(value) || 5)));
    return "★".repeat(v) + "☆".repeat(5 - v);
  }

  function initials(name) {
    return (name || "Donor").trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase();
  }

  /* ---------- Render Summary Metrics ---------- */
  function renderSummary() {
    const total = reviews.length;
    const average = total ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / total : 0;

    const avgEl = $("#averageRating");
    if (avgEl) avgEl.textContent = average.toFixed(1);

    const countEl = $("#reviewCount");
    if (countEl) countEl.textContent = total;

    const allFilter = $("#allFilterCount");
    if (allFilter) allFilter.textContent = total;

    const meter = $("#overallMeter");
    if (meter) meter.style.width = `${(average / 5) * 100}%`;

    const ids = { 5: "five", 4: "four", 3: "three", 2: "two", 1: "one" };
    [5, 4, 3, 2, 1].forEach(rating => {
      const count = reviews.filter(r => Number(r.rating) === rating).length;
      const node = $(`#${ids[rating]}Count`);
      if (node) node.textContent = count;
      const bar = node?.parentElement.querySelector(".bar span");
      if (bar) bar.style.width = total ? `${(count / total) * 100}%` : "0%";
    });
  }

  /* ---------- Render Review Cards ---------- */
  function renderReviews() {
    const sortEl = $("#sortReviews");
    const sort = sortEl ? sortEl.value : "newest";

    const shown = reviews.filter(r => activeRating === "all" || Number(r.rating) === Number(activeRating));

    if (sort === "high") shown.sort((a, b) => (b.rating || 0) - (a.rating || 0) || new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    else if (sort === "low") shown.sort((a, b) => (a.rating || 0) - (b.rating || 0) || new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    else shown.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

    const visibleCount = $("#visibleCount");
    if (visibleCount) {
      visibleCount.textContent = `Showing ${shown.length} review${shown.length === 1 ? "" : "s"}`;
    }

    const reviewList = $("#reviewList");
    if (reviewList) {
      reviewList.innerHTML = shown.map(review => `
        <article class="review-card">
          <div class="review-top">
            <div class="review-avatar" aria-hidden="true">${escapeHTML(initials(review.name))}</div>
            <div class="reviewer-info">
              <h3>${escapeHTML(review.name)}</h3>
              <p>Community donor</p>
            </div>
            <time class="review-date" datetime="${escapeHTML(review.date || "")}">${escapeHTML(formatDate(review.date || review.createdAt))}</time>
          </div>
          <div class="review-rating">
            <span class="stars" aria-label="${Number(review.rating)} out of 5 stars">${starString(Number(review.rating))}</span>
            <span class="rating-pill">${Number(review.rating)}.0 / 5</span>
          </div>
          <p class="review-text">${escapeHTML(review.text)}</p>
          <div class="review-footer">
            <span class="ngo-label">Reviewed: <strong>${escapeHTML(review.ngo || "FoodRescue")}</strong></span>
            <span class="verified-label"><span>●</span> ${review.sample ? "Sample review" : "Verified review (MongoDB)"}</span>
          </div>
        </article>
      `).join("");
    }

    const empty = $("#emptyState");
    if (empty) empty.hidden = shown.length > 0;
    if (reviewList) reviewList.hidden = shown.length === 0;
  }

  function refresh() {
    renderSummary();
    renderReviews();
  }

  function selectFilterChip(rating) {
    activeRating = rating;
    $$(".filter-chip").forEach(chip => {
      chip.classList.toggle("selected", chip.dataset.rating === String(rating));
    });
  }

  /* ---------- Star Picker (Visual highlight & click) ---------- */
  function paintStars(value) {
    $$(".pick-star").forEach(button => {
      const v = Number(button.dataset.value);
      const isActive = v <= value;
      button.classList.toggle("active", isActive);
      button.style.color = isActive ? "#f59e0b" : "#cbd5e1";
      button.setAttribute("aria-checked", v === value ? "true" : "false");
    });

    const ratingValInput = $("#ratingValue");
    if (ratingValInput) ratingValInput.value = value || "";

    const ratingHelp = $("#ratingHelp");
    if (ratingHelp) {
      ratingHelp.textContent = value ? `★ ${value} out of 5 stars selected` : "Select 1 to 5 stars";
      ratingHelp.style.color = value ? "#0d6e66" : "#64748B";
      ratingHelp.style.fontWeight = value ? "700" : "normal";
    }
  }

  /* ---------- Load Reviews from MongoDB Backend ---------- */
  async function loadBackendReviews() {
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const apiReviews = await res.json();
        if (Array.isArray(apiReviews) && apiReviews.length > 0) {
          const apiIds = new Set(apiReviews.map(r => r.id || String(r._id)));
          const uniqueSeeds = seedReviews.filter(s => !apiIds.has(s.id));
          reviews = [...apiReviews, ...uniqueSeeds];
          refresh();
          return;
        }
      }
    } catch (e) {
      console.warn("Could not load reviews from API:", e.message);
    }

    // Fallback to local storage + seed
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      reviews = [...saved, ...seedReviews];
    } catch {
      reviews = [...seedReviews];
    }
    refresh();
  }

  /* ---------- Initialize Page ---------- */
  function init() {
    loadBackendReviews();

    // Filter chips
    $$(".filter-chip").forEach(button => {
      button.addEventListener("click", () => {
        selectFilterChip(button.dataset.rating);
        renderReviews();
      });
    });

    // Sort control
    const sortControl = $("#sortReviews");
    if (sortControl) sortControl.addEventListener("change", renderReviews);

    // Clear filter
    const clearFilter = $("#clearFilter");
    if (clearFilter) {
      clearFilter.addEventListener("click", () => {
        selectFilterChip("all");
        renderReviews();
      });
    }

    // Star picker: direct click + hover effects
    $$(".pick-star").forEach(button => {
      button.style.cursor = "pointer";
      button.style.fontSize = "26px";
      button.style.background = "none";
      button.style.border = "none";
      button.style.padding = "4px";
      button.style.transition = "transform 0.15s, color 0.15s";

      button.addEventListener("mouseenter", () => {
        const hoverVal = Number(button.dataset.value);
        $$(".pick-star").forEach(b => {
          b.style.color = Number(b.dataset.value) <= hoverVal ? "#fbbf24" : "#cbd5e1";
        });
      });

      button.addEventListener("mouseleave", () => {
        paintStars(selectedStars);
      });

      button.addEventListener("click", () => {
        selectedStars = Number(button.dataset.value);
        paintStars(selectedStars);
      });

      button.addEventListener("keydown", event => {
        let next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.min(5, (selectedStars || 0) + 1);
        if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.max(1, (selectedStars || 2) - 1);
        if (next !== null) {
          event.preventDefault();
          selectedStars = next;
          paintStars(selectedStars);
          $(`.pick-star[data-value="${selectedStars}"]`)?.focus();
        }
      });
    });

    // Character counter
    const reviewText = $("#reviewText");
    if (reviewText) {
      reviewText.addEventListener("input", event => {
        const charCount = $("#charCount");
        if (charCount) charCount.textContent = `${event.target.value.length} / 600`;
      });
    }

    // Form submit -> Save to MongoDB via POST /api/reviews
    const reviewForm = $("#reviewForm");
    if (reviewForm) {
      reviewForm.addEventListener("submit", async event => {
        event.preventDefault();
        const message = $("#formMessage");
        if (message) {
          message.classList.remove("error");
          message.textContent = "Saving review to MongoDB...";
          message.style.color = "#146C65";
        }

        const name = ($("#reviewerName")?.value || "").trim();
        const text = ($("#reviewText")?.value || "").trim();

        if (!selectedStars) {
          if (message) {
            message.textContent = "Please click a star rating (1 to 5 stars) before submitting.";
            message.classList.add("error");
            message.style.color = "#DC2626";
          }
          return;
        }

        if (!name || !text) {
          if (message) {
            message.textContent = "Please fill in all required fields.";
            message.classList.add("error");
            message.style.color = "#DC2626";
          }
          return;
        }

        if (text.length < 10) {
          if (message) {
            message.textContent = "Please write at least 10 characters so your review is helpful.";
            message.classList.add("error");
            message.style.color = "#DC2626";
          }
          return;
        }

        const newReview = {
          name,
          ngo: "FoodRescue",
          rating: selectedStars,
          text,
          date: new Date().toISOString().slice(0, 10)
        };

        try {
          // POST to backend API (Saves in MongoDB Atlas)
          const response = await fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newReview)
          });

          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Failed to save review");

          // Reset form
          reviewForm.reset();
          selectedStars = 0;
          paintStars(0);
          const charCount = $("#charCount");
          if (charCount) charCount.textContent = "0 / 600";

          if (message) {
            message.textContent = "🎉 Thank you! Your review has been saved directly to MongoDB!";
            message.style.color = "#146C65";
          }

          // Reload from MongoDB
          await loadBackendReviews();
          selectFilterChip("all");

          const reviewsSec = $("#reviews");
          if (reviewsSec) reviewsSec.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (err) {
          console.error("Review save error:", err);
          if (message) {
            message.textContent = "Error saving to MongoDB: " + err.message;
            message.classList.add("error");
            message.style.color = "#DC2626";
          }
        }
      });
    }

    // Mobile nav toggle
    const menuToggle = $("#menuToggle");
    const nav = $("#mainNav");
    if (menuToggle && nav) {
      menuToggle.addEventListener("click", () => {
        const open = nav.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(open));
      });
      $$("#mainNav a").forEach(link => link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
