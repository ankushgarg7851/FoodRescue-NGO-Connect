
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

document.getElementById("welcome-user").textContent =
  `Welcome, ${currentUser.name || "Donor"}!`;

// Display success and error messages
function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#B91C1C" : "#146C65";
}

// Escape HTML before inserting donation values into the table
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// Read a response safely and report invalid or empty responses
async function readJSONResponse(response) {
  const responseText = await response.text();

  console.log("Response status:", response.status);
  console.log("Response body:", responseText);

  let result;

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Server returned an empty or invalid response (HTTP ${response.status}). Check the server terminal.`
    );
  }

  if (!response.ok) {
    throw new Error(result.error || "The server request failed.");
  }

  return result;
}

// Load donations and update dashboard statistics
async function loadDonations() {
  try {
    const response = await fetch("/api/donations", {
      cache: "no-store"
    });

    const allDonations = await readJSONResponse(response);

    if (!Array.isArray(allDonations)) {
      throw new Error("The donations API did not return a list.");
    }

    const email = (currentUser.email || "").toLowerCase();

    const myDonations = allDonations.filter(
      donation =>
        (donation.donorEmail || "").toLowerCase() === email
    );

    // Total donations
    document.getElementById("total-donations").textContent =
      myDonations.length;

    // Total servings/meals
    const totalMeals = myDonations.reduce(
      (sum, donation) => sum + Number(donation.quantity || 0),
      0
    );

    document.getElementById("total-meals").textContent =
      totalMeals.toLocaleString("en-IN");

    // Active pickups
    const activeCount = myDonations.filter(
      donation =>
        !["Delivered", "Cancelled"].includes(donation.status)
    ).length;

    document.getElementById("active-pickups").textContent =
      activeCount;

    // Empty state
    if (myDonations.length === 0) {
      donationsTable.innerHTML =
        '<tr><td colspan="5">No donations submitted yet.</td></tr>';
      return;
    }

    // Show this donor's donations
    donationsTable.innerHTML = myDonations
      .slice()
      .reverse()
      .map(donation => `
        <tr>
          <td>${escapeHTML(donation.id)}</td>
          <td>${escapeHTML(donation.foodName)}</td>
          <td>${Number(donation.quantity || 0).toLocaleString("en-IN")}</td>
          <td>${escapeHTML(donation.status)}</td>
          <td><span>Tracking will be added later</span></td>
        </tr>
      `)
      .join("");

  } catch (error) {
    console.error("Load donations error:", error);

    donationsTable.innerHTML =
      '<tr><td colspan="5">Unable to load donations. Check the server and try refreshing.</td></tr>';
  }
}

// Submit a new donation
donationForm.addEventListener("submit", async event => {
  event.preventDefault();

  // Check login
  if (!currentUser.email) {
    showMessage("Please log in before submitting a donation.", true);
    return;
  }

  // Read form values
  const foodName =
    document.getElementById("food-name").value.trim();

  const foodType =
    document.getElementById("food-type").value;

  const quantity =
    Number(document.getElementById("quantity").value);

  const pickupDate =
    document.getElementById("pickup-window").value;

  const pickupLocation =
    document.getElementById("pickup-location").value.trim();

  const notes =
    document.getElementById("additional-notes").value.trim();

  // Validate required fields
  if (!foodName || !foodType || !pickupLocation) {
    showMessage("Please complete all required fields.", true);
    return;
  }

  // Validate quantity
  if (!Number.isInteger(quantity) || quantity < 1) {
    showMessage("Enter a valid quantity of at least 1 serving.", true);
    return;
  }

  // Validate pickup date and time
  const pickupTimestamp = new Date(pickupDate).getTime();

  if (
    !pickupDate ||
    !Number.isFinite(pickupTimestamp) ||
    pickupTimestamp <= Date.now()
  ) {
    showMessage("Please select a valid future pickup date and time.", true);
    return;
  }

  // Prepare the donation object
  const donation = {
    foodName,
    foodType,
    quantity,
    pickupWindow: pickupDate,
    pickupLocation,
    notes,
    donorName: currentUser.name || "Donor",
    donorEmail: currentUser.email
  };

  // Disable the button while saving
  submitButton.disabled = true;
  submitButton.textContent = "Saving...";
  showMessage("Saving your donation...");

  try {
    // Send donation to server.js
    const response = await fetch("/api/donations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(donation)
    });

    // Parse the response safely
    const result = await readJSONResponse(response);

    console.log("Donation saved:", result.donation);

    showMessage("Donation saved successfully!");

    // Clear the form and refresh the dashboard
    donationForm.reset();
    await loadDonations();

  } catch (error) {
    console.error("Submit donation error:", error);

    showMessage(
      error.message || "Something went wrong. Please try again.",
      true
    );

  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Donation & Track";
  }
});

// Load donations when the page opens
loadDonations();
