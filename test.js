define(["jquery"], function($) {

  function tabularPresenter() {
      var columns = 
        [
         "Название",
         "Цена",
         "Класс нагрузки",
         "Фаска",
         { name: "Картинка", present: (url) => $("<img/>").attr("src",url) }
        ];

      columns.forEach((column,i,columns) => { if (!column.name) columns[i] = { name: column } });

      function fill(page) {
                $('#myTable tbody').empty();
                page.forEach(function(row, i) {
                    var tr = $('<tr/>').appendTo($('#myTable tbody'));
                    columns.forEach(column => {
                      var td = $("<td/>").appendTo(tr);
                      var value = row[column.name];
                      if (!column.present) {
                        td.text(value);
                      } else {
                        td.append(column.present(value));
                      }
                    });
                });
      }

      function init() {
        $('#myTable').removeClass('hidden');
        var tr = $('#myTable thead tr');
        tr.empty();
        columns.forEach(column => tr.append($("<th/>").text(column.name)));

        setPage(1);
      }

      function hide() {
        $('#myTable').addClass('hidden');
      }

      return {
        fill: fill,
        init: init,
        hide: hide,
        classname: 'view-list'
      };
  };

  function tilePresenter() {
    var nameProp = "Название";
    var imgProp = "Картинка";
    var details = 
     [
       "Цена",
       "Класс нагрузки",
       "Фаска"
     ];

    //не многовато верстки внутри JS? Что делать - определить как-то шаблон в HTML невидимый?
    function fill(page) {
              $('#myTiles').removeClass('hidden');
              $('#myTiles').empty();
              page.forEach(function(row, i) {
                  var tile = $('<div class = "col-sm-6 col-md-3"/>').appendTo($('#myTiles'));
                  $('<div class = "thumbnail">').append($('<img>').attr('src', row["Картинка"])).appendTo(tile);
                  var info = $('<div class = "caption text-center">').appendTo(tile);
                  info.append($('<h3>').text(row["Название"]));
                  details.forEach(prop => info.append($('<p>').text(prop + ':' + row[prop])));
              });
    }

    function hide() {
      $('#myTiles').addClass('hidden');
    }

    return {
      fill: fill,
      init: () => {},
      hide: hide,
      classname: 'view-tiles'
    };
  }

  function loadPage(pageIdx) {
      if (typeof pageIdx != "number") throw "Number expected"; //primitives are immutable and that's what we actually want here

      var url = 'data.json?page=' + pageIdx;

      return $.ajax({
        url: url,
        dataType : "json",
        success: function (result, textStatus) {
            result.page = result.page.slice(pageSize*(pageIdx-1), pageSize*pageIdx); //todo proper server-side pagination support

            $('#urldebug').text('URL=' + url);
            pageCnt = Math.ceil(result.total / pageSize);
            presenter.fill(result.page);
        } 
      });
  }

  function init() {
      [tabularPresenter(), tilePresenter()].forEach(p =>
          $('.page-item.' + p.classname + ' a').click(eventObject => setPresenter(p)));
      setPresenter(tilePresenter());
      setPage(1);
  }

  function setPresenter(_presenter) {
    if (presenter)
      presenter.hide();
    presenter = _presenter;
    presenter.init();
    $('.page-item.view-mode').removeClass("active");
    $('.page-item.' + presenter.classname).addClass("active");
    if (page) setPage(page);
  }

  function setPage(pageNum) {
      if (typeof pageNum != "number") throw "Number expected"; //immutability check because we use async processing here
      loadPage(pageNum).done(() => { updateNav(pageNum); page = pageNum; }).fail((xhr, text) => alert(text));
  }

  function updateNav(pageNum) {
      var ul = $('.tablepages');
      ul.empty();
      if (pageCnt == 1)
         return;

      //1st
      if (1 != pageNum)
          $('<li class="page-item"/>').append($('<a class="page-link page-direct" href = "#"/>').text(1)).appendTo(ul);

      //prev
      if (1 != pageNum - 1 && pageNum != 1)
          $('<li class="page-item"><a class="page-link page-prev" href = "#">&laquo;</a></li>').appendTo(ul);

      //this
      $('<li class="page-item active"/>').append($('<a class="page-link page-direct" href = "#"/>').text(pageNum)).appendTo(ul);

      //next
      if (pageCnt != pageNum + 1 && pageNum != pageCnt)
          $('<li class="page-item"><a class="page-link page-next" href = "#">&raquo;</a></li>').appendTo(ul);

      //last
      if (pageCnt != pageNum)
          $('<li class="page-item"/>').append($('<a class="page-link page-direct" href = "#"/>').text(pageCnt)).appendTo(ul);

      //Set up handlers here so we can consume module internals instead of global vars/fns
      $('.page-link.page-direct').click(eventObject => setPage(Number(eventObject.target.text)));
      $('.page-link.page-next').click(eventObject => setPage(page + 1));
      $('.page-link.page-prev').click(eventObject => setPage(page - 1));
  }

  var page = 1;
  var pageCnt = 10; 
  var pageSize = 5;
  var presenter;

  return {
    init: init
  }
});
