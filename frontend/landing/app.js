const searchForm = document.getElementById("searchForm");
const title = document.getElementById("title")

searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    title.classList.add("inactive");

    const res = await fetch("/api/stories");
    const stories = await res.json();
    console.log(stories);
});

