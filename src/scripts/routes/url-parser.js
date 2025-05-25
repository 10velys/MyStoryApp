const getActiveRoute = () => {
  const url = window.location.hash.slice(1);
  const splitedUrl = _splitUrl(url);

  console.log("[URL Parser] getActiveRoute - Original URL:", url);
  console.log("[URL Parser] getActiveRoute - Splited:", splitedUrl);

  if (splitedUrl.resource === "story" && splitedUrl.id) {
    console.log("[URL Parser] getActiveRoute - Returning story route with ID:", splitedUrl.id);
    return `/story/:id`;
  }

  const route = splitedUrl.resource ? `/${splitedUrl.resource.toLowerCase()}` : "/";
  console.log("[URL Parser] getActiveRoute - Returning route:", route);
  return route;
};

const parseActivePathname = () => {
  const hash = window.location.hash.slice(1);
  const splittedPath = hash.split("/");
  console.log("URL Parser: Parsing path", hash, "split into", splittedPath);

  if (splittedPath[1] && splittedPath[1].toLowerCase() === "story" && splittedPath[2]) {
    const id = splittedPath[2];
    console.log("URL Parser: Story detail path found with ID:", id);
    return { id };
  }

  console.log("URL Parser: Not a story detail path or missing ID");
  return { id: null };
};

const getActiveDetailRoute = () => {
  const url = window.location.hash.slice(1);
  const splitedUrl = _splitUrl(url);

  console.log("[URL Parser] getActiveDetailRoute - URL:", url);

  const detailRoute = splitedUrl.id
    ? `/${splitedUrl.resource}/${splitedUrl.id}`
    : null;
  console.log("[URL Parser] getActiveDetailRoute - Returning:", detailRoute);

  return detailRoute;
};

const getActiveRouteWithParams = () => {
  const url = window.location.hash.slice(1);
  const splitedUrl = _splitUrl(url);

  console.log("[URL Parser] getActiveRouteWithParams - URL:", url);
  console.log("[URL Parser] getActiveRouteWithParams - Params:", {
    resource: splitedUrl.resource || null,
    id: splitedUrl.id || null,
    verb: splitedUrl.verb || null,
  });

  return {
    resource: splitedUrl.resource || null,
    id: splitedUrl.id || null,
    verb: splitedUrl.verb || null,
  };
};

const _splitUrl = (url) => {
  const urlsSplits = url.split("/");

  return {
    resource: urlsSplits[1] || null,
    id: urlsSplits[2] || null,
    verb: urlsSplits[3] || null,
  };
};

export {
  getActiveRoute,
  getActiveDetailRoute,
  getActiveRouteWithParams,
  parseActivePathname,
};