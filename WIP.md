WORK IN PROGRESS...
We can use isToastShowing flag later > if nothing change in the options we can simply return it from showToast = if (isToastShowing) {
console.warn("Toast already showing, ignoring request");
return;
}

# DONE >> Have to handle multiple container issue in html => as of now done we covered the most of the basics for multiple toast

# DONE >> temp= need to check createToastElement function => done

# TODO >>next = Have to implement in case of multiple toast max 3 toast should get visible and rest of it in the queue thanks and also get and provided this feature to the users as option but by default behavior is max 3 toast on UI.
