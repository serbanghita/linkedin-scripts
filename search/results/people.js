/**
 * 1. Go to https://www.linkedin.com/in/{contact}
 * 2. On the profile page navigate to "400 connections"
 * 3. Press F12 (open Chrome Developer Tools).
 * 4. Copy and apply script in the console.
 * 5. Wait for the navigation to finish.
 */

/*
.search-results-page

    "998 results"
    .search-results__total

    .search-result--person
        .search-result__info

            href="/in/danielspiridon/"
            .search-result__result-link

            "Daniel Spiridon"
            .actor-name

            "Partner of McKinsey & Company in Romania"
            > .subline-level-1

            "Bucharest, Romania"
            > .subline-level-2
 */

(function() {
    // The amount to be scrolled.
    const SEARCH_RESULTS_PER_PAGE = 10;
    let loopId = 0, loopTick = 0;
    let currentPage = 1, lastPage = 0, pagination;
    const copyToClipboard = copy;

    class SearchResult {
        constructor(searchResultElement) {
            this.element = searchResultElement;
            this.result = Object.create(null);

            this.fetchProfileLink();
            this.fetchName();
            this.fetchSubtitle();
            this.setJobAndCompany();
            this.fetchLocation();
        }

        fetchProfileLink() {
            const elem = this.element.querySelector(".search-result__result-link");
            let linkUrl = "";
            if (elem) {
                const linkHrefValue = elem.getAttribute("href");
                // LinkedIN profile URLs in href's are relative to the origin.
                linkUrl = linkHrefValue ? `${window.location.origin}${linkHrefValue}` : "";
            }
            this.result["profileLink"] = linkUrl;
        }

        fetchName() {
            const elem = this.element.querySelector(".actor-name");
            this.result["name"] = elem.innerText.trim();
        }

        fetchSubtitle() {
            const elem = this.element.querySelector(".subline-level-1");
            this.result["subtitle"] = elem.innerText.trim();
        }

        setJobAndCompany() {
            const subtitle = this.result["subtitle"];
            const subtitleArr = subtitle.split(" at ");
            this.result["job"] = subtitleArr[0] || "";
            this.result["company"] = subtitleArr[1] || "";
        }

        fetchLocation() {
            const elem = this.element.querySelector(".subline-level-2");
            this.result["location"] = elem.innerText.trim();
        }

        getResult() {
            return this.result;
        }
        getResultAsCSVLine() {
            const result = this.result;
            const csvLine = Object.keys(result).reduce((acc, key) => {
                return `${(acc === "" ? "" : `${acc},`)}"${result[key]}"`
            }, "") + "\n";
            return csvLine;
        }
    }

    class Pagination {
        constructor(paginationElem) {
            this.element = paginationElem;
        }

        nextButton() {
            return this.element.querySelector(".artdeco-pagination__button--next");
        }

        static isLoading() {
            return document.querySelector(".search-is-loading")
        }

        canGoNext() {
            const elem = this.nextButton();
            return !elem.classList.contains("artdeco-button--disabled")
        }

        goNext() {
            const btn = this.nextButton();
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        }

        getCurrentPage() {
            const elem = this.element.querySelector(".artdeco-pagination__indicator--number.selected");
            if (elem) {
                return parseInt(elem.dataset.testPaginationPageBtn, 10);
            } else {
                return 1;
            }
        }
    }

    function getExpectedTotalResult() {
        return parseInt(document.querySelector(".search-results .search-results__total").innerText);
    }

    function getSearchResults() {
        const searchResultsElem = document.querySelector(".search-results-page");
        const searchResults = searchResultsElem.querySelectorAll(".search-result--person .search-result__info");
        return searchResults;
    }

    function processPage(outputType) {
        console.log(`Processing page no. ${pagination.getCurrentPage()} ...`)

        const searchResults = getSearchResults();
        if (outputType === "JSON") {
            return Array.from(searchResults).map((searchResultElement) => {
                const searchResult = new SearchResult(searchResultElement);
                return searchResult.getResult();
            });
        } else {
            // CSV is the default output.
            return Array.from(searchResults).map((searchResultElement) => {
                const searchResult = new SearchResult(searchResultElement);
                return searchResult.getResultAsCSVLine();
            });
        }
    }

    function scrollPage() {
        // window.scrollTo(0, document.body.getBoundingClientRect().height);
        window.scrollTo(0, 500);
        const pagination = fetchPaginationElement();
        if (pagination) {
            pagination.scrollIntoView();
        }
        console.log(`Scrolling to bottom ...`);
    }

    function hasOccludedEntities() {
        return document.querySelectorAll(`.search-results__list .search-result__occlusion-hint`).length > 0;
    }

    // Check if pagination element exist.
    function doesPageNeedScrolling() {
        if (hasOccludedEntities() || !fetchPaginationElement()) {
            return true;
        }

        fetchPagination();

        if (pagination.canGoNext() && getSearchResults() < SEARCH_RESULTS_PER_PAGE) {
            return true;
        }

        return false;
    }

    function fetchPaginationElement() {
        return document.querySelector(".artdeco-pagination");
    }

    function fetchPagination() {
        const paginationElem = fetchPaginationElement()
        if (paginationElem) {
            pagination = new Pagination(paginationElem);
        }
    }

    function loop(now) {
        // Loop (FPS).
        loopTick += 1;

        if (loopTick > 128) {
            if (doesPageNeedScrolling() || Pagination.isLoading()) {
                scrollPage();
            } else {
                fetchPagination();
                currentPage = pagination.getCurrentPage();


                if (currentPage !== lastPage) {
                    const result = processPage("CSV");
                    results = results.concat(result);
                    lastPage = currentPage;

                    pagination.goNext();
                } else {
                    if (!pagination.canGoNext()) {
                        console.log(`Nice, you fetched all ${results.length} (expected ${expectedTotalResult}) in the clipboard! Go paste them somewhere.`);
                        copyToClipboard(results.join(""));
                        return cancelAnimationFrame(loopId);
                    }
                }
            }

            loopTick = 0;
        }



        loopId = requestAnimationFrame(loop);
    }

    function isOnPage() {
        return window.location.pathname.match(/^\/search\/results\/people\//);
    }

    if (!isOnPage()) {
        console.error(`You need to be on "Search results page" eg. https://www.linkedin.com/search/results/people/?[...] in order for this script to work.`)
        return;
    }


    let results = [];
    const expectedTotalResult = getExpectedTotalResult();
    console.log("Starting fetching all people from the current search ...");
    loop(0);
})();

