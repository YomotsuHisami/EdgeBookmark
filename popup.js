// popup.js

document.addEventListener("DOMContentLoaded", () => {
  const statusDiv = document.getElementById("status");
  const goToMarkButton = document.getElementById("goToMark");

  // Query the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      statusDiv.textContent = "No active tab found.";
      return;
    }

    const activeTab = tabs[0];
    const url = activeTab.url;

    if (!url.startsWith("http")) {
      statusDiv.textContent = "Cannot navigate to mark on this page.";
      return;
    }

    // Retrieve the saved scroll position
    chrome.storage.local.get([url], (result) => {
      if (chrome.runtime.lastError) {
        console.error("Error retrieving scroll position:", chrome.runtime.lastError);
        statusDiv.textContent = "Error retrieving scroll position.";
        return;
      }

      const savedScrollY = result[url];

      if (typeof savedScrollY === "number") {
        statusDiv.textContent = "A saved scroll position exists for this page.";
        goToMarkButton.style.display = "block";

        goToMarkButton.addEventListener("click", () => {
          chrome.scripting.executeScript(
            {
              target: { tabId: activeTab.id },
              func: scrollToPosition,
              args: [savedScrollY]
            },
            () => {
              if (chrome.runtime.lastError) {
                console.error("Script injection failed:", chrome.runtime.lastError.message);
                statusDiv.textContent = "Failed to navigate to scroll position.";
              } else {
                console.log(`Scrolled to position: ${savedScrollY}`);
                statusDiv.textContent = "Navigated to saved scroll position.";
              }
            }
          );
        });
      } else {
        statusDiv.textContent = "No saved scroll position for this page.";
      }
    });
  });
});

/**
 * Function to scroll the window to a specific vertical position.
 * This function is executed within the context of the webpage.
 * @param {number} scrollY - The vertical scroll position to navigate to.
 */
function scrollToPosition(scrollY) {
  window.scrollTo(0, scrollY);
}
