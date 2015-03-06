/*global angular */

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
angular.module('todomvc')
	.controller('TodoCtrl', function TodoCtrl($scope, $routeParams, $filter, store) {
		'use strict';
		var vm = this;
		var todos = vm.todos = store.todos;

		vm.newTodo = '';
		vm.editedTodo = null;

		$scope.$watch('todos', function () {
			$scope.remainingCount = $filter('filter')(todos, { completed: false }).length;
			$scope.completedCount = todos.length - $scope.remainingCount;
			$scope.allChecked = !$scope.remainingCount;
		}, true);

		// Monitor the current route for changes and adjust the filter accordingly.
		$scope.$on('$routeChangeSuccess', function () {
			var status = $scope.status = $routeParams.status || '';

			$scope.statusFilter = (status === 'active') ?
				{ completed: false } : (status === 'completed') ?
				{ completed: true } : null;
		});

		vm.addTodo = function () {
			var newTodo = {
				title: vm.newTodo.trim(),
				completed: false
			};

			if (!newTodo.title) {
				return;
			}

			vm.saving = true;
			store.insert(newTodo)
				.then(function success() {
					vm.newTodo = '';
				})
				.finally(function () {
					vm.saving = false;
				});
		};

		vm.editTodo = function (todo) {
			vm.editedTodo = todo;
			// Clone the original todo to restore it on demand.
			vm.originalTodo = angular.extend({}, todo);
		};

		vm.saveEdits = function (todo, event) {
			// Blur events are automatically triggered after the form submit event.
			// This does some unfortunate logic handling to prevent saving twice.
			if (event === 'blur' && vm.saveEvent === 'submit') {
				vm.saveEvent = null;
				return;
			}

			vm.saveEvent = event;

			if (vm.reverted) {
				// Todo edits were reverted-- don't save.
				vm.reverted = null;
				return;
			}

			todo.title = todo.title.trim();

			if (todo.title === vm.originalTodo.title) {
				vm.editedTodo = null;
				return;
			}

			store[todo.title ? 'put' : 'delete'](todo)
				.then(function success() {}, function error() {
					todo.title = vm.originalTodo.title;
				})
				.finally(function () {
					vm.editedTodo = null;
				});
		};

		vm.revertEdits = function (todo) {
			todos[todos.indexOf(todo)] = vm.originalTodo;
			vm.editedTodo = null;
			vm.originalTodo = null;
			vm.reverted = true;
		};

		vm.removeTodo = function (todo) {
			store.delete(todo);
		};

		vm.saveTodo = function (todo) {
			store.put(todo);
		};

		vm.toggleCompleted = function (todo, completed) {
			if (angular.isDefined(completed)) {
				todo.completed = completed;
			}
			store.put(todo, todos.indexOf(todo))
				.then(function success() {}, function error() {
					todo.completed = !todo.completed;
				});
		};

		vm.clearCompletedTodos = function () {
			store.clearCompleted();
		};

		vm.markAll = function (completed) {
			todos.forEach(function (todo) {
				if (todo.completed !== completed) {
					vm.toggleCompleted(todo, completed);
				}
			});
		};
	});
