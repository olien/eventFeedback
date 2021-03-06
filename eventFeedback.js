function EventFeedBack($element, $options){
	this.options = $.extend({}, EventFeedBack.DEFAULTS, $options)		
	this.element = $($element) || $(document.body);
	this.eventHandler = 'click';

	this.setListener();
}

EventFeedBack.DEFAULTS = {
	lockEvent: false,
	prefix: 'feedback',
	timeout: 1000,
	zindex: 1060,
	size: {
		width: 50,
		height: 50
	},
	offset: {
		top: 25,
		left: 25
	}
};

EventFeedBack.prototype = {
	setListener: function(){
		var t = this;
		this.element.on(this.eventHandler, function(event){
			var self = $(this);
			if (t.options.lockEvent && self.data('feedback-loading') == true) {
				return; // do nothing, bubble away
			}
			
			t.toggleFeedback(self, event, true, t.options.offset);
					
			var complete = function(){
				setTimeout(function(){
					t.toggleFeedback(self, event, false,  t.options.offset);
				}, (t.options.timeout))
			}
			
			$.support.transition ? 
				self.one('fdTransitionEnd', function () {
					t.toggleFeedback(self, event, false, t.options.offset);
				}).emulateTransitionEnd(t.options.timeout) : 
				complete();
		});
	},
	toggleFeedback: function(element, event, $state, $offset){
		var position = this.getEventPosition(event, $offset);
		if($state){
			this.createFeedBackElement(Math.round(position.timestamp), position.x, position.y);
			element.data(EventFeedBack.DEFAULTS.prefix+'-loading', $state);
			element.attr('aria-pressed', $state);
		}else{
			element.removeClass(this.options.prefix+'-active');
			element.attr('aria-pressed', false);
			element.data(EventFeedBack.DEFAULTS.prefix+'-loading', false);
			this.removeFeedBackElement(Math.round(position.timestamp));
		}
	},
	setPosition: function(el, $x, $y){
		var t = this;
		return el.css({
			'top': $y,
			'left':$x,
			'width': t.options.size.width,
			'height': t.options.size.height,
			'position': 'absolute',
			'z-index': t.options.zindex
		})
	},
	getEventPosition: function($event, $offset) {
		$offset = ($offset || {top:0, left: 0});
		var event = $event;
		return {
			x: (event.pageX) - $offset.left,
			y: (event.pageY) - $offset.top,
			timestamp: event.timeStamp
		}
	}, 
	createFeedBackElement: function(timestamp, $x, $y){
		var clickArea = document.createElement('div');
		var objBody = $(document.body);

		clickArea.setAttribute('id', 'event'+EventFeedBack.DEFAULTS.prefix+timestamp);
		clickArea.setAttribute('data-event-'+this.options.prefix, 'true');
		clickArea.setAttribute('class', this.options.prefix+'-active');

		objBody.append(clickArea);

		return this.setPosition($(clickArea), $x, $y);
	},
	removeFeedBackElement: function(timestamp){
		return document.getElementById('event'+EventFeedBack.DEFAULTS.prefix+timestamp).remove();
	}
};

+function ($) {
	"use strict";
	/**
	 * Plugin
	 *
	 * @param $option {object || string}
	 * @return function
	 *
	 * =======================
	 */
	function Plugin($option) {
		return this.each(function () {
			var self    = $(this);
			var data    = self.data('eventFeedback');
			var options = $.extend({}, EventFeedBack.DEFAULTS, self.data(), typeof $option == "object" && $option);

			if (!data) {
				self.data('eventFeedback', (data = new EventFeedBack(this, options)));
			}
		});
	}

	var old = $.fn.eventFeedback;

	$.fn.eventFeedback             = Plugin;
	$.fn.eventFeedback.Constructor = EventFeedBack;

	/**
	 * actionFeedback No Conflict
	 *
	 * @return object
	 *
	 * =======================
	 */
	$.fn.eventFeedback.noConflict = function () {
		$.fn.eventFeedback = old;
		return this;
	};


	// CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
	// ============================================================

	function transitionEnd() {
		var el = document.createElement('feedback')

		var transEndEventNames = {
			WebkitTransition : 'webkitTransitionEnd',
			MozTransition    : 'transitionend',
			OTransition      : 'oTransitionEnd otransitionend',
			transition       : 'transitionend'
		}

		for (var name in transEndEventNames) {
			if (el.style[name] !== undefined) {
				return { end: transEndEventNames[name] }
			}
		}

		return false // explicit for ie8 (  ._.)
	}

	// http://blog.alexmaccaw.com/css-transitions
	$.fn.emulateTransitionEnd = function (duration) {
		var called = false;
		var $el = this;
		$(this).one('fdTransitionEnd', function () { called = true });
		var callback = function () { if (!called) $($el).trigger($.support.transition.end) };
		setTimeout(callback, duration);
		return this
	};

	$(function () {
		$.support.transition = transitionEnd();

		if (!$.support.transition) return;

		$.event.special.fdTransitionEnd = {
			bindType: $.support.transition.end,
			delegateType: $.support.transition.end,
			handle: function (e) {
				if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments)
			}
		}
	})

}(jQuery);
