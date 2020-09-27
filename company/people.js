/**
 * 1. Go to https://www.linkedin.com/company/{company}/people/
 * 2. Press F12 (open Chrome Developer Tools).
 * 3. Copy and apply script in the console.
 */

/*************************************************************************
 * CSS Selectors
 * ************************************************************************

"312 employees"
.org-organization-page__container .artdeco-card > div:first-child > span

    .org-people-profiles-module__profile-list
        .org-people-profile-card                    <---- Array of "Profile cards"

            "David Kovara"
                [data-control-name="people_profile_card_name_link"] >
            .org-people-profile-card__profile-title

            "2nd degree connection"
                .artdeco-entity-lockup__badge span.a11y-text

            "Head of Talent Development at Permira"
                .artdeco-entity-lockup__subtitle .lt-line-clamp

            "1 shared connection"
                .org-people-profile-card__profile-info > span span
 *************************************************************************/



(function() {

    // The amount to be scrolled.
    const MOUSE_SCROLL_AMOUNT = 1000;
    let loopId = 0, loopTick = 0;
    let totalEmployees = 0;
    const copyToClipboard = copy;

    class ProfileCard {
        constructor(profileCardElement) {
            this.element = profileCardElement;
            this.result = Object.create(null);

            this.fetchProfileLink();
            this.fetchName();
            this.fetchConnectionType();
            this.fetchSubtitle();
            this.setJobAndCompany();
            this.fetchSharedConnections();
        }
        fetchProfileLink() {
            let linkElem = this.element.querySelector('[data-control-name="people_profile_card_name_link"]');
            let linkUrl = "";
            if (linkElem) {
                const linkHrefValue = linkElem.getAttribute("href");
                // LinkedIN profile URLs in href's are relative to the origin.
                linkUrl = linkHrefValue ? `${window.location.origin}${linkHrefValue}` : "";
            }
            this.result["profileLink"] = linkUrl;
        }
        fetchName() {
            let nameElem = this.element.querySelector(".artdeco-entity-lockup__title .org-people-profile-card__profile-title");
            if (!nameElem) {
                nameElem = this.element.querySelector(".artdeco-entity-lockup__title");
            }
            this.result["name"] = nameElem.innerText.trim()
        }
        fetchConnectionType() {
            const connectionTypeElem = this.element.querySelector(".artdeco-entity-lockup__badge span.a11y-text");
            this.result["connectionType"] = connectionTypeElem ? connectionTypeElem.innerText.trim() : "";
        }
        fetchSubtitle() {
            this.result["subtitle"] = this.element.querySelector(".artdeco-entity-lockup__subtitle .lt-line-clamp").innerText.trim();
        }
        setJobAndCompany() {
            const subtitle = this.result["subtitle"];
            const subtitleArr = subtitle.split(" at ");
            this.result["job"] = subtitleArr[0] || "";
            this.result["company"] = subtitleArr[1] || "";
        }
        fetchSharedConnections() {
            const sharedConnectionElem = this.element.querySelector(".org-people-profile-card__profile-info > span span");
            this.result["sharedConnections"] = sharedConnectionElem ? sharedConnectionElem.innerText.trim() : "";
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

    function scrollPage() {
        window.scrollBy(0, MOUSE_SCROLL_AMOUNT);
        console.log(`Scrolling ${MOUSE_SCROLL_AMOUNT}px ...`);
    }

    function doesPageNeedScrolling() {
        const profileCards = getProfileCards();
        return profileCards.length < totalEmployees;
    }

    function getProfileCards() {
        const profileList = document.querySelector(".org-people-profiles-module__profile-list");
        const profileCards = profileList.querySelectorAll(".org-people-profile-card");
        return profileCards;
    }

    function getTotalEmployees() {
        let totalEmployees = document.querySelector(".org-organization-page__container .artdeco-card > div:first-child > span").innerText;
        totalEmployees = parseInt(totalEmployees);
        return totalEmployees;
    }

    function processPage(outputType) {
        console.log(`Processing page ...`)
        console.log(`Organization should have: ${totalEmployees}.`);

        const profileCards = getProfileCards();
        if (profileCards.length < totalEmployees) {
            console.warn(`Only ${profileCards.length} profile cards found. Keep manual scrolling until you reach the end and then re-apply the script.`);
        }
        if (profileCards.length === totalEmployees) {
            console.log(`Nice, you fetched all ${totalEmployees} in the clipboard! Go paste them somewhere.`)
        }

        if (outputType === "JSON") {
            return Array.from(profileCards).map((profileCardElement) => {
                const profileCard = new ProfileCard(profileCardElement);
                return profileCard.getResult();
            });
        }
        // CSV is the default output.
        return Array.from(profileCards).map((profileCardElement) => {
            const profileCard = new ProfileCard(profileCardElement);
            return profileCard.getResultAsCSVLine();
        }).join("");
    }

    function loop(now) {
        loopTick += 1;

        if (loopTick > 32) {
            if (doesPageNeedScrolling()) {
                scrollPage();
            } else {
                const result = processPage("JSON")
                copyToClipboard(result)
                // console.log(result);

                return cancelAnimationFrame(loopId);
            }

            loopTick = 0;
        }

        loopId = requestAnimationFrame(loop);
    }

    function isOnPeoplePage() {
        return window.location.pathname.match(/^\/company\/.*\/people\//);
    }

    if (!isOnPeoplePage()) {
        console.error(`You need to be on a company "People page" eg. https://www.linkedin.com/company/{company}/people/ in order for this script to work.`)
        return;
    }
    totalEmployees = getTotalEmployees()
    loop(0);


})();