const searchForm = document.getElementById("searchForm");
const title = document.getElementById("title")

searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    title.classList.add("inactive");

    console.log("ayaya");
});

