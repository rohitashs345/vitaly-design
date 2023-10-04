function saveForLaterInit(swat) {
  // console.log("[SFL] Initializing ...");
  localStorage.setItem('SFLNeedsToFetch', 'true');

  function onError(error) {
    // Error is an xhrObject
    console.error("[SFL] ERROR: SFL not initiated.", error);
  }

  function onSuccess(response) {
    // console.log(
    //   "[SFL] Successfully Initialized, And we created a Save for Later List.",
    //   response
    // );
    console.log('[SFL] Successfully Initialized.')
    const prevSFLListID = localStorage.getItem("SFLListID");
    const newSFLListID = response?.list?.lid;
    if (prevSFLListID == null && newSFLListID == null) {
      console.log("[SFL] New and Prev SFL List IDs are undefined.");
    } else if (newSFLListID == prevSFLListID) {
      // console.log(
      //   "[SFL] New SFL List ID is the same as the Prev SFL List ID in Local Storage. Prev SFL List ID: ",
      //   prevSFLListID,
      //   " should equal New SFL List ID: ",
      //   newSFLListID
      // );
    } else if (newSFLListID != prevSFLListID) {
      localStorage.setItem("SFLListID", response?.list?.lid);
      // console.log(
      //   "[SFL] A new SFL List ID has been set to Local Storage. Prev SFL List ID: ",
      //   prevSFLListID,
      //   " --> New SFL List ID: ",
      //   newSFLListID
      // );
    }
  }
  swat.SaveForLater.init(onSuccess, onError);
}

if (!window.SwymCallbacks) {
  window.SwymCallbacks = [];
}
window.SwymCallbacks.push(saveForLaterInit);
