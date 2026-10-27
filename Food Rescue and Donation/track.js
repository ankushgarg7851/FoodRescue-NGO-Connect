
document.addEventListener("DOMContentLoaded", function () {
    const donationId = document.querySelector(".donation-id");
    const statusElement = document.querySelector(".status");
    const timelineItems = document.querySelectorAll(
        ".timeline-card .timeline-item"
    );
    const supportButton = document.querySelector(".support-button");
.
    if (!donationId || !statusElement || timelineItems.length === 0) {
        console.error("Tracking page elements could not be found.");
        return;
    }

    const idMatch = donationId.textContent.match(/FR-\d{4}-\d+/);
    const currentDonationId = idMatch ? idMatch[0] : "Unknown";

    donationId.style.cursor = "pointer";
    donationId.title = "Click to copy donation ID";

    donationId.addEventListener("click", async function () {
        try {
            await navigator.clipboard.writeText(currentDonationId);
            alert("Donation ID copied: " + currentDonationId);
        } catch (error) {
            alert("Your donation ID is: " + currentDonationId);
        }
    });

    function updateDonationStatus() {
        const pendingItem = document.querySelector(
            ".timeline-card .timeline-item.pending"
        );

        if (pendingItem) {
            statusElement.textContent = "IN TRANSIT";
        } else {
            statusElement.textContent = "DELIVERED";
        }
    }

    updateDonationStatus();

    timelineItems.forEach(function (item) {
        item.style.cursor = "pointer";

        item.addEventListener("click", function () {
            const heading = item.querySelector("h3");
            const description = item.querySelector(".timeline-copy p");

            if (heading && description) {
                alert(
                    heading.textContent + "\n\n" +
                    description.textContent
                );
            }
        });
    });

    if (supportButton) {
        supportButton.addEventListener("click", function () {
            console.log("Opening FoodRescue support email.");
        });
    }

    console.log("Track Your Donation JavaScript loaded successfully.");
});
