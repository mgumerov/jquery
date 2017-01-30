//TODO Websockets использовать чтоб подписаться на изменения например списка брендов? Не так чтоб это прямо было обязательно,
//  но это эффективнее, чем при каждом запросе поллить или с каким-то периодом
define(["jquery", "test-data", "handlebars"], function($, data, handlebars) {

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
      $('[data-filter-bind]').toArray().map(_ => { var s = $(_); eval(s.attr('data-filter-bind'))(s); });
      filters = {};
      //По идее в начале на форме и так пустой фильтр, но формально так будет правильнее
      $('[data-filter-clear]').toArray().map(_ => { var s = $(_); eval(s.attr('data-filter-clear'))(s); });
      $('[data-filter-load]').toArray().map(_ => { var s = $(_); eval(s.attr('data-filter-load'))(s); });

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
    startReloadPage();
  }

  function startReloadPage() {
    if (page) startSetPage(page);
  }

  function startSetPage(pageNum) {
      if (typeof pageNum != "number") throw "Number expected"; //immutability check because we use async processing here

      //По идее на каждое изменение мы фильтры перечитываем, но если вдруг это изменится и вообще на всякий случай - перечитаем
      $('[data-filter-load]').toArray().map(_ => { var s = $(_); eval(s.attr('data-filter-load'))(s); });
      data.startGetPage(pageNum, pageSize, filters)
          .then(
              (result) => {
                var pgcount = Math.ceil(result.total / pageSize);

                //Если такой страницы уже нет, ничего не делаем и вместо этого потребуем переход на ту, которая по нашим данным есть
                //Может получиться, что фильтр сменился за это время на гуи, и возможно придется еще раз перечитать,
                //  но это уже забота этого следующего порожденного нами асинка, не наша
                if (pageNum > pgcount) {
                  //Заметим, что всякий раз номер страницы уменьшается, т.е. вечный цикл невозможен. Но конечно возможно, в теории,
                  //адское торможение, если сервер будет постепенно удалять элементы, и успевать каждый раз уменьшить кол-во страниц на 1
                  //как раз тогда, когда мы решили перейти на страницу назад; todo возможно, следует после 2-3 попыток сбрасывать сразу на первую страницу.
                  //todo Ручной переход на страницу например "1" должен откючать уже запущенные такие "автоматические" коррекционные повторные переходы, 
                  //  не то они отменят его действие
                  startSetPage(pgcount, pageSize, filters);
                  return $.Deferred().reject(null);
                }

                presenter.fill(result.page);
                return pgcount;
              })
          .then(
              function done(pageCount) {
                $('#urldebug').text('page=' + pageNum);
                pageCnt = pageCount;
                page = pageNum;
                updateNav();
              },
              function failed(text) { if (text) alert(text); }
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

  //Generic checklist filter
  function handleChecklistFilterChange( event ) {
    var filterRoot = $(event.target).parents('[data-filter-load]');
    var menu = filterRoot.find('.dropdown-menu');
    if (event.currentTarget == event.target) {//direct click on a link text
      if (!$(event.target).attr("data-value")) { // = "all"
        menu.find('a input').prop('checked', true);
      } else {
        menu.find('a input').prop('checked', false);
        $(event.target).find('input').prop('checked', true);
      }
    }
    loadClassFilter(filterRoot);
    startReloadPage();
    return true;
  }

  function readChecklistFilter(filterRootSelector) {
    var menu = filterRootSelector.find('.dropdown-menu');
    if (menu.find('input:not(:checked)').length == 0) {
      return null;
    } else {
      return menu.find('input:checked').parent().toArray().map($).map(_ => _.attr("data-value"));
    }
  }

  function clearChecklistFilter(filterRootSelector) {
      filterRootSelector.find('.dropdown-menu a').find('input').prop('checked', true);
  }

  //Class filter
  function loadClassFilter(filterRootSelector) {
    var selection = readChecklistFilter(filterRootSelector);
    if (selection) {filters.classes = selection.map(Number)} else {delete filters.classes};
  }

  function bindClassFilter(filterRootSelector) {
      filterRootSelector.find('.dropdown-menu a').on('click', event => handleChecklistFilterChange(event, loadClassFilter));
  }

  //Brand filter
  function loadBrandFilter(filterRootSelector) {
    var selection = readChecklistFilter(filterRootSelector);
    if (selection) {filters.brands = selection} else {delete filters.brands};
  }

  function bindBrandFilter(filterRootSelector) {
      filterRootSelector.find('.dropdown-toggle').prop('disabled', true);

      //сразу при показе; но также, по идее, при любом опросе страницы. Опять не знаю, как "правильно".
      //Плюс если перестроили фильтр, надо и прежний в нем выбор запоминать и восстанавливать. Но пока не перестраиваем.
      data.startGetBrands().then(function success(set) {
          set.forEach(_ => {
                  var li = $('<li>').appendTo(filterRootSelector.find('ul'));
                  var a = $('<a href="#" class="small" tabIndex="-1">').attr("data-value", _).appendTo(li);
                  $('<input type="checkbox"/>').appendTo(a);
                  a.append('\xa0' + _);
          });
          filterRootSelector.find('.dropdown-menu a').on('click', event => handleChecklistFilterChange(event, loadBrandFilter));
          clearChecklistFilter(filterRootSelector);
          filterRootSelector.find('.dropdown-toggle').prop('disabled', false);
      });
  }

  var page;
  var pageCnt;
  var pageSize = 12;
  var presenter;
  var filters;

  return {
    init: init
  }
});
