define(["jquery"], function($) {
  var result = {};
  result.startGetPage =
      //returns a promise which resolves to {total, page} on success and status-text on failure
      function (pageIdx, pageSize, filters) {
          //we use those in async handler so let's make sure they are immutable
          if (typeof pageIdx != "number") throw "Number expected";
          if (typeof pageSize != "number") throw "Number expected";

          return $.ajax({
            dataType : "json",
            url: 'data.json', 
            data: { page: pageIdx } //url params for GET //todo + filters
          })
          .promise()
          .then( function done(result, textStatus) {
                     var filtered = result.page;
                     if (filters && filters.classes) {
                       filtered = filtered.filter(_ => filters.classes.includes(_['Класс нагрузки']));
                     }
                     //In fact, returns empty array if requested a page beyond all available items
                     return {
                       total: filtered.length,
                       page: filtered.slice(pageSize*(pageIdx-1), pageSize*pageIdx) //todo proper server-side pagination support
                     }
                 },
                 function failed(xhr, text) { return $.Deferred().reject(text); } );
      };

  result.startGetBrands =
      //returns a promise which resolves to string[] on success and status-text on failure
      function () {
          return $.ajax({
            dataType : "json",
            url: 'data.json',
            data: { unique: "Бренд" } //url params for GET
          })
          .promise()
          .then( function done(result, textStatus) {
                     return result;
                 },
                 function failed(xhr, text) { return $.Deferred().reject(text); } );
      };

  return result;
});
