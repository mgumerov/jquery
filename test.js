define(["jquery", "test-data", "handlebars"], function($, startGetData, handlebars) {

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

        startSetPage(1);
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
    function fill(page) {
              $('#myTiles').removeClass('hidden');
              $('#myTiles').empty();
              page.forEach(function(row, i) {
                    var source = $("#sampleTile").html();
                    var template = handlebars.compile(source);
                    var html = template(row);
                    $('#myTiles').append(html);
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

  function init() {
      $('.dropdown-menu a').on( 'click', function( event ) {
        if (event.currentTarget == event.target) {//direct click on a link text
          $('.dropdown-menu a input').prop('checked', false);
          $(event.target).find('input').prop('checked', true);
        }
        alert($('.dropdown-menu input:checked').parent().text());
        return true;
      });
      [tabularPresenter(), tilePresenter()].forEach(p =>
          $('.page-item.' + p.classname + ' a').click(eventObject => setPresenter(p)));
      setPresenter(tilePresenter());
      startSetPage(1);
  }

  function setPresenter(_presenter) {
    if (presenter)
      presenter.hide();
    presenter = _presenter;
    presenter.init();
    $('.page-item.view-mode').removeClass("active");
    $('.page-item.' + presenter.classname).addClass("active");

    //if we've been showing something, present it another way
    if (page) startSetPage(page);
  }

  function startSetPage(pageNum) {
      if (typeof pageNum != "number") throw "Number expected"; //immutability check because we use async processing here
      startGetData(pageNum, pageSize)
          .then(
              (result) => {
                $('#urldebug').text('page=' + pageNum);
                presenter.fill(result.page);
                return Math.ceil(result.total / pageSize);
              })
          .then(
              function done(pageCount) {
                //todo what is pageCnt < pageNum due to filtering or server-side changes?
                pageCnt = pageCount;
                page = pageNum;
                updateNav();
              },
              function failed(text) { alert(text); }
          );
  }

  function updateNav() {
      var ul = $('.tablepages');
      ul.toggleClass("hidden", pageCnt == 1);
      if (pageCnt == 1)
         return;

      ul.find('a.page-link[data-source]').each((_i,_a) => { var a = $(_a); a.text(eval(a.attr("data-source"))); });
      var vis = {
        home: (1 != page),
        prev: (1 != page - 1 && page != 1),
        next: (pageCnt != page + 1 && page != pageCnt),
        end: (pageCnt != page)
      };
      ul.find('a.page-link[data-visible]').each((_i,_a) => { var a = $(_a); a.toggleClass("hidden", !eval(a.attr("data-visible"))); });

      //Set up handlers here so we can consume module internals instead of global vars/fns
      ul.find('.page-link').off();
      ul.find('.page-link.page-direct').click(eventObject => startSetPage(Number(eventObject.target.text)));
      ul.find('.page-link.page-next').click(eventObject => startSetPage(page + 1));
      ul.find('.page-link.page-prev').click(eventObject => startSetPage(page - 1));
  }

  var page;
  var pageCnt;
  var pageSize = 12;
  var presenter;

  return {
    init: init
  }
});
