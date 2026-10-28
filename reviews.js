/* FoodRescue – Ratings & Reviews
   Link in your HTML with:  <script src="reviews.js" defer></script>
   (and remove the inline <script> block from the <head>) */
(() => {
  "use strict";

  /* ---------- Sample (seed) reviews ---------- */
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

  /* ---------- Storage helpers ---------- */
  function getSavedReviews() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function loadReviews() {
    return [...getSavedReviews(), ...seedReviews];
  }

  /* ---------- Utilities ---------- */
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
  }

  function formatDate(date) {
    const parsed = new Date(date + "T12:00:00");
    return Number.isNaN(parsed.getTime())
      ? "Recently"
      : parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  function starString(value) {
    return "★".repeat(value) + "☆".repeat(5 - value);
  }

  function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase();
  }

  /* ---------- Rendering ---------- */
  function renderSummary() {
    const total = reviews.length;
    const average = total ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / total : 0;

    $("#averageRating").textContent = average.toFixed(1);
    $("#reviewCount").textContent = total;
    $("#allFilterCount").textContent = total;
    $("#overallMeter").style.width = `${(average / 5) * 100}%`;

    const ids = { 5: "five", 4: "four", 3: "three", 2: "two", 1: "one" };
    [5, 4, 3, 2, 1].forEach(rating => {
      const count = reviews.filter(r => Number(r.rating) === rating).length;
      const node = $(`#${ids[rating]}Count`);
      if (!node) return;
      node.textContent = count;
      const bar = node.parentElement.querySelector(".bar span");
      if (bar) bar.style.width = total ? `${(count / total) * 100}%` : "0%";
    });
  }

  function renderReviews() {
    const sort = $("#sortReviews").value;
    const shown = reviews.filter(r => activeRating === "all" || Number(r.rating) === Number(activeRating));

    if (sort === "high") shown.sort((a, b) => b.rating - a.rating || new Date(b.date) - new Date(a.date));
    else if (sort === "low") shown.sort((a, b) => a.rating - b.rating || new Date(b.date) - new Date(a.date));
    else shown.sort((a, b) => new Date(b.date) - new Date(a.date));

    $("#visibleCount").textContent = `Showing ${shown.length} review${shown.length === 1 ? "" : "s"}`;

    $("#reviewList").innerHTML = shown.map(review => `
      <article class="review-card">
        <div class="review-top">
          <div class="review-avatar" aria-hidden="true">${escapeHTML(initials(review.name))}</div>
          <div class="reviewer-info"><h3>${escapeHTML(review.name)}</h3><p>Community donor</p></div>
          <time class="review-date" datetime="${escapeHTML(review.date)}">${escapeHTML(formatDate(review.date))}</time>
        </div>
        <div class="review-rating">
          <span class="stars" aria-label="${Number(review.rating)} out of 5 stars">${starString(Number(review.rating))}</span>
          <span class="rating-pill">${Number(review.rating)}.0 / 5</span>
        </div>
        <p class="review-text">${escapeHTML(review.text)}</p>
        <div class="review-footer">
          <span class="ngo-label">Reviewed: <strong>${escapeHTML(review.ngo || "FoodRescue")}</strong></span>
          <span class="verified-label"><span>●</span> ${review.sample ? "Sample review" : "Local demo review"}</span>
        </div>
      </article>`).join("");

    $("#emptyState").hidden = shown.length > 0;
    $("#reviewList").hidden = shown.length === 0;
  }

  function refresh() {
    renderSummary();
    renderReviews();
  }

  function selectFilterChip(rating) {
    activeRating = rating;
    $$(".filter-chip").forEach(chip => chip.classList.toggle("selected", chip.dataset.rating === String(rating)));
  }

  /* ---------- Star picker ---------- */
  function paintStars(value) {
    $$(".pick-star").forEach(button => {
      const v = Number(button.dataset.value);
      button.classList.toggle("active", v <= value);
      button.setAttribute("aria-checked", v === value ? "true" : "false");
    });
    $("#ratingValue").value = value || "";
    $("#ratingHelp").textContent = value ? `${value} out of 5 stars selected` : "Select 1 to 5 stars";
  }

  /* ---------- Init ---------- */
  function init() {
    reviews = loadReviews();

    // Filter chips
    $$(".filter-chip").forEach(button => button.addEventListener("click", () => {
      selectFilterChip(button.dataset.rating);
      renderReviews();
    }));

    // Sort + clear filter
    $("#sortReviews").addEventListener("change", renderReviews);
    $("#clearFilter").addEventListener("click", () => {
      selectFilterChip("all");
      renderReviews();
    });

    // Star picker (click + keyboard)
    $$(".pick-star").forEach(button => {
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
          $(`.pick-star[data-value="${selectedStars}"]`).focus();
        }
      });
    });

    // Character counter
    $("#reviewText").addEventListener("input", event => {
      $("#charCount").textContent = `${event.target.value.length} / 600`;
    });

    // Form submit
    $("#reviewForm").addEventListener("submit", event => {
      event.preventDefault();
      const message = $("#formMessage");
      message.classList.remove("error");

      const name = $("#reviewerName").value.trim();
      const text = $("#reviewText").value.trim();

      if (!selectedStars) {
        message.textContent = "Please select a star rating before submitting.";
        message.classList.add("error");
        return;
      }
      if (!name || !text) {
        message.textContent = "Please complete all required fields.";
        message.classList.add("error");
        return;
      }
      if (text.length < 10) {
        message.textContent = "Please write a little more so your feedback is helpful (at least 10 characters).";
        message.classList.add("error");
        return;
      }

      const newReview = {
        id: `user-${Date.now()}`,
        name,
        ngo: "FoodRescue",
        rating: selectedStars,
        text,
        date: new Date().toISOString().slice(0, 10),
        sample: false
      };

      const saved = getSavedReviews();
      saved.unshift(newReview);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      } catch (error) {
        message.textContent = "Your browser could not save this review. Please check local storage settings and try again.";
        message.classList.add("error");
        return;
      }

      reviews = [...saved, ...seedReviews];
      selectFilterChip("all");
      refresh();

      event.target.reset();
      selectedStars = 0;
      paintStars(0);
      $("#charCount").textContent = "0 / 600";
      message.textContent = "Thanks for sharing your feedback! It has been added to this browser's demo review list.";
      $("#reviews").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Mobile menu
    const menuToggle = $("#menuToggle");
    const nav = $("#mainNav");
    menuToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });
    $$("#mainNav a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }));

    refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
