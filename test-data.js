define(["jquery"], function($) {
  //returns a promise which resolves to {total, page} on success and status-text on failure
  return function (pageIdx, pageSize) {
      //we use those in async handler so let's make sure they are immutable
      if (typeof pageIdx != "number") throw "Number expected";
      if (typeof pageSize != "number") throw "Number expected";

      return $.ajax({
        url: 'data.json?page=' + pageIdx,
        dataType : "json"
      })
      .promise()
      .then( function done(result, textStatus) {
                 return {
                   total: result.total,
                   page: result.page.slice(pageSize*(pageIdx-1), pageSize*pageIdx) //todo proper server-side pagination support
                 }
             },
             function failed(xhr, text) { return $.Deferred().reject(text); } );
  }
});
