(function(){

angular.module('ui.grid').directive('uiGridColumnMenu', ['$log', '$timeout', '$window', '$document', '$injector', 'gridUtil', 'uiGridConstants', function ($log, $timeout, $window, $document, $injector, gridUtil, uiGridConstants) {

  var uiGridColumnMenu = {
    priority: 0,
    scope: {},
    require: '?^uiGrid',
    templateUrl: 'ui-grid/uiGridColumnMenu',
    replace: true,
    link: function ($scope, $elm, $attrs, uiGridCtrl) {
      gridUtil.enableAnimations($elm);

      $scope.grid = uiGridCtrl.grid;

      var self = this;

      // Store a reference to this link/controller in the main uiGrid controller
      uiGridCtrl.columnMenuCtrl = self;

      // Save whether we're shown or not so the columns can check
      self.shown = false;

      // Put asc and desc sort directions in scope
      $scope.asc = uiGridConstants.ASC;
      $scope.desc = uiGridConstants.DESC;

      var inner = $elm[0].querySelectorAll('.inner');

      var $animate;
      try {
        $animate = $injector.get('$animate');
      }
      catch (e) {
        $log.info('$animate service not found (ngAnimate not add as a dependency?), menu animations will not occur');
      }

      // Show the menu
      self.showMenu = function(column, $columnElement) {
        // Swap to this column
        //   note - store a reference to this column in 'self' so the columns can check whether they're the shown column or not
        self.col = $scope.col = column;

        // Remove an existing document click handler
        $document.off('click', documentClick);

        /* Reposition the menu below this column's element */
        var left = $columnElement[0].offsetLeft;
        var top = $columnElement[0].offsetTop;

        // Get the grid scrollLeft
        var offset = 0;
        if (uiGridCtrl.grid.options.offsetLeft) {
          offset = uiGridCtrl.grid.options.offsetLeft;
        }

        var height = gridUtil.elementHeight($columnElement, true);
        var width = gridUtil.elementWidth($columnElement, true);

        // Flag for whether we're hidden for showing via $animate
        var hidden = false;

        // Re-position the menu AFTER it's been shown, so we can calculate the width correctly.
        function reposition() {
          $timeout(function() {
            if (hidden && $animate) {
              $animate.removeClass(inner, 'ng-hide');
              self.shown = $scope.menuShown = true;
            }

            var myWidth = gridUtil.elementWidth($elm, true);

            // TODO(c0bra): use padding-left/padding-right based on document direction (ltr/rtl), place menu on proper side
            // Get the column menu right padding
            var paddingRight = parseInt($elm.css('padding-right'), 10);

            $elm.css('left', (left - offset + width - myWidth + paddingRight) + 'px');
            $elm.css('top', (top + height) + 'px');

            // Hide the menu on a click on the document
            $document.on('click', documentClick);
          });
        }

        if ($scope.menuShown && $animate) {
          // Animate closing the menu on the current column, then animate it opening on the other column
          $animate.addClass(inner, 'ng-hide', reposition);
          hidden = true;
        }
        else {
          self.shown = $scope.menuShown = true;
          reposition();
        }
      };

      // Hide the menu
      self.hideMenu = function() {
        self.col = null;
        self.shown = $scope.menuShown = false;
      };

      // Prevent clicks on the menu from bubbling up to the document and making it hide prematurely
      // $elm.on('click', function (event) {
      //   event.stopPropagation();
      // });

      function documentClick() {
        $scope.$apply(self.hideMenu);
        $document.off('click', documentClick);
      }
      
      $window.addEventListener('resize', self.hideMenu);

      $scope.$on('$destroy', $scope.$on(uiGridConstants.events.GRID_SCROLL, function(evt, args) {
        self.hideMenu();
        if (! $scope.$$phase) { $scope.$apply(); }
      }));

      $scope.$on('$destroy', $scope.$on(uiGridConstants.events.ITEM_DRAGGING, function(evt, args) {
        self.hideMenu();
        if (! $scope.$$phase) { $scope.$apply(); }
      }));

      $scope.$on('$destroy', function() {
        $window.removeEventListener('resize', self.hideMenu);
        $document.off('click', documentClick);
      });

      /* Column methods */
      $scope.sortColumn = function (event, dir) {
        event.stopPropagation();

        uiGridCtrl.grid.sortColumn($scope.col, dir, true)
          .then(function () {
            uiGridCtrl.refreshRows();
            self.hideMenu();
          });
      };

      $scope.unsortColumn = function () {
        $scope.col.unsort();

        uiGridCtrl.refreshRows();
        self.hideMenu();
      };
    }
  };

  return uiGridColumnMenu;

}]);

})();