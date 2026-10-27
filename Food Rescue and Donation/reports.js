
document.addEventListener("DOMContentLoaded", function () {
    const dateFilter = document.querySelector(".date-filter");
    const statCards = document.querySelectorAll(".stats-grid .stat-card");
    const categoryItems = document.querySelectorAll(
        ".category-list .category-item"
    );
    const partnerRows = document.querySelectorAll(
        ".partner-list .partner-row"
    );
    const downloadLinks = document.querySelectorAll(
        ".download-card .download-button"
    );


    if (dateFilter) {
        const periods = ["Last 30 days", "Last 90 days", "This year"];
        let selectedPeriod = 0;

        dateFilter.addEventListener("click", function () {
            selectedPeriod = (selectedPeriod + 1) % periods.length;

            const label = dateFilter.querySelector("span");
            if (label) {
                label.textContent = periods[selectedPeriod];
            }
        });
    }

    statCards.forEach(function (card) {
        const heading = card.querySelector(".stat-top span");
        const value = card.querySelector("h2");

        if (heading && value) {
            card.title = heading.textContent + ": " + value.textContent;
        }
    });

    // Highlight a food category when it is clicked.
    categoryItems.forEach(function (item) {
        item.style.cursor = "pointer";
        item.setAttribute("tabindex", "0");

        function showCategory() {
            const name = item.querySelector(".category-heading span");
            const percentage = item.querySelector(
                ".category-heading strong"
            );

            if (name && percentage) {
                alert(
                    name.textContent + "\nShare of donations: " +
                    percentage.textContent
                );
            }
        }

        item.addEventListener("click", showCategory);

        item.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                showCategory();
            }
        });
    });

    partnerRows.forEach(function (row) {
        row.style.cursor = "pointer";
        row.setAttribute("tabindex", "0");

        function showPartner() {
            const name = row.querySelector(".partner-name");
            const amount = row.querySelector(".partner-amount");
            const rating = row.querySelector(".partner-rating");

            if (name && amount && rating) {
                alert(
                    "Partner: " + name.textContent +
                    "\nFood contributed: " + amount.textContent +
                    "\nRating: " + rating.textContent
                );
            }
        }

        row.addEventListener("click", showPartner);

        row.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                showPartner();
            }
        });
    });

    function downloadCSV() {
        const rows = [
            ["FoodRescue Reports & Analytics"],
            ["Metric", "Value"]
        ];

        statCards.forEach(function (card) {
            const label = card.querySelector(".stat-top span");
            const value = card.querySelector("h2");

            if (label && value) {
                rows.push([label.textContent.trim(), value.textContent.trim()]);
            }
        });

        rows.push([]);
        rows.push(["Top Contributing Partners"]);
        rows.push(["Partner", "Contribution", "Rating"]);

        partnerRows.forEach(function (row) {
            const name = row.querySelector(".partner-name");
            const amount = row.querySelector(".partner-amount");
            const rating = row.querySelector(".partner-rating");

            if (name && amount && rating) {
                rows.push([
                    name.textContent.trim(),
                    amount.textContent.trim(),
                    rating.textContent.trim()
                ]);
            }
        });

        const csv = rows.map(function (row) {
            return row.map(function (cell) {
                return '"' + String(cell ?? "").replace(/"/g, '""') + '"';
            }).join(",");
        }).join("\r\n");

        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "donation-history.csv";

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    downloadLinks.forEach(function (link) {
        if (link.getAttribute("href") === "donation-history.csv") {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                downloadCSV();
            });
        }
    });

    console.log("Reports & Analytics JavaScript loaded successfully.");
});
