
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Articles.svelte generated by Svelte v3.19.2 */

    const { console: console_1 } = globals;
    const file = "src\\Articles.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (27:0) {#if articles[0] != 1 }
    function create_if_block(ctx) {
    	let main;
    	let each_value = /*onelineArticles*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(main, "id", "articles");
    			attr_dev(main, "class", "svelte-1kedvyx");
    			add_location(main, file, 27, 0, 642);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*onelineArticles*/ 2) {
    				each_value = /*onelineArticles*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(main, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(27:0) {#if articles[0] != 1 }",
    		ctx
    	});

    	return block;
    }

    // (31:2) {#each articles as article}
    function create_each_block_1(ctx) {
    	let article;
    	let a;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let p0;
    	let t1_value = /*article*/ ctx[7].description + "";
    	let t1;
    	let t2;
    	let h1;
    	let t3_value = /*article*/ ctx[7].title + "";
    	let t3;
    	let t4;
    	let p1;
    	let t5_value = /*article*/ ctx[7].source + "";
    	let t5;
    	let t6;
    	let t7_value = /*article*/ ctx[7].publishedAt + "";
    	let t7;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			article = element("article");
    			a = element("a");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			h1 = element("h1");
    			t3 = text(t3_value);
    			t4 = space();
    			p1 = element("p");
    			t5 = text(t5_value);
    			t6 = text(" - ");
    			t7 = text(t7_value);
    			attr_dev(img, "class", "article__image svelte-1kedvyx");
    			if (img.src !== (img_src_value = /*article*/ ctx[7].urlToImage)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "200px");
    			add_location(img, file, 35, 5, 951);
    			attr_dev(p0, "class", "article__description svelte-1kedvyx");
    			add_location(p0, file, 37, 6, 1040);
    			attr_dev(div0, "class", "svelte-1kedvyx");
    			add_location(div0, file, 36, 5, 1027);
    			attr_dev(div1, "class", "img svelte-1kedvyx");
    			add_location(div1, file, 34, 4, 927);
    			attr_dev(h1, "class", "article__title svelte-1kedvyx");
    			add_location(h1, file, 40, 4, 1129);
    			attr_dev(p1, "class", "article__info svelte-1kedvyx");
    			add_location(p1, file, 42, 4, 1255);
    			attr_dev(a, "href", a_href_value = /*article*/ ctx[7].url);
    			attr_dev(a, "class", "svelte-1kedvyx");
    			add_location(a, file, 32, 3, 812);
    			attr_dev(article, "class", "article__container svelte-1kedvyx");
    			add_location(article, file, 31, 2, 770);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, a);
    			append_dev(a, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t1);
    			append_dev(a, t2);
    			append_dev(a, h1);
    			append_dev(h1, t3);
    			append_dev(a, t4);
    			append_dev(a, p1);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    			append_dev(p1, t7);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(31:2) {#each articles as article}",
    		ctx
    	});

    	return block;
    }

    // (29:1) {#each onelineArticles as articles}
    function create_each_block(ctx) {
    	let div;
    	let t;
    	let each_value_1 = /*articles*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "netflix__container svelte-1kedvyx");
    			add_location(div, file, 29, 1, 703);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*onelineArticles*/ 2) {
    				each_value_1 = /*articles*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(29:1) {#each onelineArticles as articles}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let if_block_anchor;
    	let if_block = /*articles*/ ctx[0][0] != 1 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*articles*/ ctx[0][0] != 1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { articles } = $$props;
    	let num = 4;
    	let onelineArticles = [];
    	let tempContainer = [];
    	let i = 1;

    	articles.forEach(article => {
    		tempContainer.push(article);

    		if (i % num == 0) {
    			onelineArticles.push(tempContainer);
    			tempContainer = [];
    		}

    		i += 1;
    	});

    	// console.log(onelineArticles)
    	console.log(window);

    	window.addEventListener("mousemove", () => {
    		console.log(document.body.clientWidth);
    	});

    	const writable_props = ["articles"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Articles> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Articles", $$slots, []);

    	$$self.$set = $$props => {
    		if ("articles" in $$props) $$invalidate(0, articles = $$props.articles);
    	};

    	$$self.$capture_state = () => ({
    		articles,
    		num,
    		onelineArticles,
    		tempContainer,
    		i
    	});

    	$$self.$inject_state = $$props => {
    		if ("articles" in $$props) $$invalidate(0, articles = $$props.articles);
    		if ("num" in $$props) num = $$props.num;
    		if ("onelineArticles" in $$props) $$invalidate(1, onelineArticles = $$props.onelineArticles);
    		if ("tempContainer" in $$props) tempContainer = $$props.tempContainer;
    		if ("i" in $$props) i = $$props.i;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [articles, onelineArticles];
    }

    class Articles extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { articles: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Articles",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*articles*/ ctx[0] === undefined && !("articles" in props)) {
    			console_1.warn("<Articles> was created without expected prop 'articles'");
    		}
    	}

    	get articles() {
    		throw new Error("<Articles>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set articles(value) {
    		throw new Error("<Articles>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\HeaderComponent\Button.svelte generated by Svelte v3.19.2 */
    const file$1 = "src\\HeaderComponent\\Button.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "SET";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "CLEAR";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "EXIT";
    			attr_dev(button0, "class", "svelte-f3a2iw");
    			add_location(button0, file$1, 9, 4, 277);
    			attr_dev(button1, "class", "svelte-f3a2iw");
    			add_location(button1, file$1, 10, 4, 318);
    			attr_dev(button2, "class", "svelte-f3a2iw");
    			add_location(button2, file$1, 11, 4, 363);
    			attr_dev(div, "class", "button svelte-f3a2iw");
    			add_location(div, file$1, 8, 0, 251);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(div, t3);
    			append_dev(div, button2);

    			dispose = [
    				listen_dev(button0, "click", /*set*/ ctx[0], false, false, false),
    				listen_dev(button1, "click", /*clear*/ ctx[1], false, false, false),
    				listen_dev(button2, "click", /*close*/ ctx[2], false, false, false)
    			];
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	const set = () => dispatch("set");
    	const clear = () => dispatch("clear");
    	const close = () => dispatch("close");
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Button", $$slots, []);

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		set,
    		clear,
    		close
    	});

    	return [set, clear, close];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\HeaderComponent\Sources.svelte generated by Svelte v3.19.2 */
    const file$2 = "src\\HeaderComponent\\Sources.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[7] = list;
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (14:8) {#each sources as source}
    function create_each_block$1(ctx) {
    	let div;
    	let input;
    	let input_id_value;
    	let t0;
    	let label;
    	let t1_value = /*source*/ ctx[6].name + "";
    	let t1;
    	let label_for_value;
    	let t2;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[5].call(input, /*source*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", input_id_value = /*source*/ ctx[6].name);
    			attr_dev(input, "class", "svelte-ukn6js");
    			add_location(input, file$2, 15, 16, 553);
    			attr_dev(label, "for", label_for_value = /*source*/ ctx[6].name);
    			add_location(label, file$2, 16, 16, 639);
    			attr_dev(div, "class", "item svelte-ukn6js");
    			toggle_class(div, "checked", /*source*/ ctx[6].checked);
    			add_location(div, file$2, 14, 12, 485);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			input.checked = /*source*/ ctx[6].checked;
    			append_dev(div, t0);
    			append_dev(div, label);
    			append_dev(label, t1);
    			append_dev(div, t2);
    			dispose = listen_dev(input, "change", input_change_handler);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*sources*/ 1 && input_id_value !== (input_id_value = /*source*/ ctx[6].name)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*sources*/ 1) {
    				input.checked = /*source*/ ctx[6].checked;
    			}

    			if (dirty & /*sources*/ 1 && t1_value !== (t1_value = /*source*/ ctx[6].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*sources*/ 1 && label_for_value !== (label_for_value = /*source*/ ctx[6].name)) {
    				attr_dev(label, "for", label_for_value);
    			}

    			if (dirty & /*sources*/ 1) {
    				toggle_class(div, "checked", /*source*/ ctx[6].checked);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(14:8) {#each sources as source}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let current;
    	const button = new Button({ $$inline: true });
    	button.$on("set", /*set*/ ctx[1]);
    	button.$on("clear", /*clear*/ ctx[2]);
    	button.$on("close", /*close*/ ctx[3]);
    	let each_value = /*sources*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			create_component(button.$$.fragment);
    			t = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "container svelte-ukn6js");
    			add_location(div0, file$2, 12, 4, 413);
    			attr_dev(div1, "class", "header_open");
    			add_location(div1, file$2, 10, 0, 319);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			mount_component(button, div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*sources*/ 1) {
    				each_value = /*sources*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(button);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	const set = () => dispatch("set");
    	const clear = () => dispatch("clear");
    	const close = () => dispatch("close");
    	let { sources } = $$props;
    	const writable_props = ["sources"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sources> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sources", $$slots, []);

    	function input_change_handler(source) {
    		source.checked = this.checked;
    		$$invalidate(0, sources);
    	}

    	$$self.$set = $$props => {
    		if ("sources" in $$props) $$invalidate(0, sources = $$props.sources);
    	};

    	$$self.$capture_state = () => ({
    		Button,
    		createEventDispatcher,
    		dispatch,
    		set,
    		clear,
    		close,
    		sources
    	});

    	$$self.$inject_state = $$props => {
    		if ("sources" in $$props) $$invalidate(0, sources = $$props.sources);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sources, set, clear, close, dispatch, input_change_handler];
    }

    class Sources extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { sources: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sources",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*sources*/ ctx[0] === undefined && !("sources" in props)) {
    			console.warn("<Sources> was created without expected prop 'sources'");
    		}
    	}

    	get sources() {
    		throw new Error("<Sources>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sources(value) {
    		throw new Error("<Sources>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\HeaderComponent\Date.svelte generated by Svelte v3.19.2 */
    const file$3 = "src\\HeaderComponent\\Date.svelte";

    function create_fragment$3(ctx) {
    	let div5;
    	let t0;
    	let div4;
    	let div1;
    	let div0;
    	let t2;
    	let input0;
    	let t3;
    	let div3;
    	let div2;
    	let t5;
    	let input1;
    	let current;
    	let dispose;
    	const button = new Button({ $$inline: true });
    	button.$on("set", /*set*/ ctx[4]);
    	button.$on("clear", /*clear*/ ctx[5]);
    	button.$on("close", /*close*/ ctx[6]);

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			create_component(button.$$.fragment);
    			t0 = space();
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "from";
    			t2 = space();
    			input0 = element("input");
    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div2.textContent = "to";
    			t5 = space();
    			input1 = element("input");
    			attr_dev(div0, "class", "svelte-16dz53h");
    			add_location(div0, file$3, 45, 12, 1406);
    			attr_dev(input0, "type", "date");
    			attr_dev(input0, "name", "party");
    			attr_dev(input0, "min", /*minday*/ ctx[8]);
    			attr_dev(input0, "max", /*varTo*/ ctx[3]);
    			attr_dev(input0, "class", "svelte-16dz53h");
    			toggle_class(input0, "changed", /*fromDate*/ ctx[0]);
    			add_location(input0, file$3, 46, 12, 1435);
    			attr_dev(div1, "class", "date svelte-16dz53h");
    			add_location(div1, file$3, 44, 8, 1374);
    			attr_dev(div2, "class", "svelte-16dz53h");
    			add_location(div2, file$3, 49, 12, 1619);
    			attr_dev(input1, "type", "date");
    			attr_dev(input1, "name", "party");
    			attr_dev(input1, "min", /*varFrom*/ ctx[2]);
    			attr_dev(input1, "max", /*today*/ ctx[7]);
    			attr_dev(input1, "class", "svelte-16dz53h");
    			toggle_class(input1, "changed", /*toDate*/ ctx[1]);
    			add_location(input1, file$3, 50, 12, 1646);
    			attr_dev(div3, "class", "date svelte-16dz53h");
    			add_location(div3, file$3, 48, 8, 1587);
    			attr_dev(div4, "class", "calendar svelte-16dz53h");
    			add_location(div4, file$3, 43, 4, 1342);
    			attr_dev(div5, "class", "header_open");
    			add_location(div5, file$3, 41, 0, 1248);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			mount_component(button, div5, null);
    			append_dev(div5, t0);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t2);
    			append_dev(div1, input0);
    			set_input_value(input0, /*varFrom*/ ctx[2]);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div3, t5);
    			append_dev(div3, input1);
    			set_input_value(input1, /*varTo*/ ctx[3]);
    			current = true;

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[17]),
    				listen_dev(input0, "change", /*minChanged*/ ctx[9], false, false, false),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[18]),
    				listen_dev(input1, "change", /*maxChanged*/ ctx[10], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*varTo*/ 8) {
    				attr_dev(input0, "max", /*varTo*/ ctx[3]);
    			}

    			if (dirty & /*varFrom*/ 4) {
    				set_input_value(input0, /*varFrom*/ ctx[2]);
    			}

    			if (dirty & /*fromDate*/ 1) {
    				toggle_class(input0, "changed", /*fromDate*/ ctx[0]);
    			}

    			if (!current || dirty & /*varFrom*/ 4) {
    				attr_dev(input1, "min", /*varFrom*/ ctx[2]);
    			}

    			if (dirty & /*varTo*/ 8) {
    				set_input_value(input1, /*varTo*/ ctx[3]);
    			}

    			if (dirty & /*toDate*/ 2) {
    				toggle_class(input1, "changed", /*toDate*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_component(button);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { fromDate } = $$props;
    	let { toDate } = $$props;
    	const dispatch = createEventDispatcher();
    	const set = () => dispatch("set");
    	const clear = () => dispatch("clear");
    	const close = () => dispatch("close");
    	let date = new Date();
    	let month = date.getMonth() + 1;
    	let day = date.getDate();
    	let minDay;
    	let minMonth;

    	if (day > 28) {
    		minDay = 1;
    		minMonth = month;
    	} else {
    		minDay = day + 1;
    		minMonth = month == 1 ? 12 : month - 1;
    	}

    	if (month <= 10) month = "0" + month.toString();
    	if (day < 10) day = "0" + day.toString();
    	if (minMonth <= 10) minMonth = "0" + minMonth.toString();
    	if (minDay < 10) minDay = "0" + minDay.toString();
    	let today = `${date.getFullYear()}-${month}-${day}`;
    	let minday = `${date.getFullYear()}-${minMonth}-${minDay}`;

    	function minChanged() {
    		$$invalidate(0, fromDate = varFrom);
    	}

    	function maxChanged() {
    		$$invalidate(1, toDate = varTo);
    	}

    	const writable_props = ["fromDate", "toDate"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Date> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Date", $$slots, []);

    	function input0_input_handler() {
    		varFrom = this.value;
    		(($$invalidate(2, varFrom), $$invalidate(0, fromDate)), $$invalidate(8, minday));
    	}

    	function input1_input_handler() {
    		varTo = this.value;
    		(($$invalidate(3, varTo), $$invalidate(1, toDate)), $$invalidate(7, today));
    	}

    	$$self.$set = $$props => {
    		if ("fromDate" in $$props) $$invalidate(0, fromDate = $$props.fromDate);
    		if ("toDate" in $$props) $$invalidate(1, toDate = $$props.toDate);
    	};

    	$$self.$capture_state = () => ({
    		Button,
    		createEventDispatcher,
    		fromDate,
    		toDate,
    		dispatch,
    		set,
    		clear,
    		close,
    		date,
    		month,
    		day,
    		minDay,
    		minMonth,
    		today,
    		minday,
    		minChanged,
    		maxChanged,
    		varFrom,
    		varTo
    	});

    	$$self.$inject_state = $$props => {
    		if ("fromDate" in $$props) $$invalidate(0, fromDate = $$props.fromDate);
    		if ("toDate" in $$props) $$invalidate(1, toDate = $$props.toDate);
    		if ("date" in $$props) date = $$props.date;
    		if ("month" in $$props) month = $$props.month;
    		if ("day" in $$props) day = $$props.day;
    		if ("minDay" in $$props) minDay = $$props.minDay;
    		if ("minMonth" in $$props) minMonth = $$props.minMonth;
    		if ("today" in $$props) $$invalidate(7, today = $$props.today);
    		if ("minday" in $$props) $$invalidate(8, minday = $$props.minday);
    		if ("varFrom" in $$props) $$invalidate(2, varFrom = $$props.varFrom);
    		if ("varTo" in $$props) $$invalidate(3, varTo = $$props.varTo);
    	};

    	let varFrom;
    	let varTo;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*fromDate*/ 1) {
    			//need error log...when from date go over to date...
    			 $$invalidate(2, varFrom = fromDate ? fromDate : minday);
    		}

    		if ($$self.$$.dirty & /*toDate*/ 2) {
    			 $$invalidate(3, varTo = toDate ? toDate : today);
    		}
    	};

    	return [
    		fromDate,
    		toDate,
    		varFrom,
    		varTo,
    		set,
    		clear,
    		close,
    		today,
    		minday,
    		minChanged,
    		maxChanged,
    		month,
    		day,
    		minDay,
    		minMonth,
    		dispatch,
    		date,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Date_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { fromDate: 0, toDate: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Date_1",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*fromDate*/ ctx[0] === undefined && !("fromDate" in props)) {
    			console.warn("<Date> was created without expected prop 'fromDate'");
    		}

    		if (/*toDate*/ ctx[1] === undefined && !("toDate" in props)) {
    			console.warn("<Date> was created without expected prop 'toDate'");
    		}
    	}

    	get fromDate() {
    		throw new Error("<Date>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fromDate(value) {
    		throw new Error("<Date>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toDate() {
    		throw new Error("<Date>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toDate(value) {
    		throw new Error("<Date>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\HeaderComponent\Info.svelte generated by Svelte v3.19.2 */

    const { console: console_1$1 } = globals;
    const file$4 = "src\\HeaderComponent\\Info.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (24:12) {#each info as i}
    function create_each_block$2(ctx) {
    	let div;
    	let t0_value = /*i*/ ctx[4][0] + "";
    	let t0;
    	let t1;
    	let t2_value = /*i*/ ctx[4][1] + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = text(" : ");
    			t2 = text(t2_value);
    			attr_dev(div, "class", "svelte-nhe2s2");
    			add_location(div, file$4, 24, 16, 620);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(24:12) {#each info as i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div2;
    	let div1;
    	let button;
    	let t1;
    	let div0;
    	let dispose;
    	let each_value = /*info*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			button = element("button");
    			button.textContent = "EXIT";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(button, "class", "svelte-nhe2s2");
    			add_location(button, file$4, 21, 8, 505);
    			attr_dev(div0, "class", "info svelte-nhe2s2");
    			add_location(div0, file$4, 22, 8, 553);
    			attr_dev(div1, "class", "info_container svelte-nhe2s2");
    			add_location(div1, file$4, 20, 4, 467);
    			attr_dev(div2, "class", "header_open svelte-nhe2s2");
    			add_location(div2, file$4, 19, 0, 436);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, button);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			dispose = listen_dev(button, "click", /*close*/ ctx[0], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*info*/ 2) {
    				each_value = /*info*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { searchInfo } = $$props;
    	console.log(searchInfo);
    	const dispatch = createEventDispatcher();
    	const close = () => dispatch("close");
    	let info = [];

    	for (let key in searchInfo) {
    		if (!searchInfo[key]) {
    			info.push([key, ""]);
    		} else {
    			info.push([key, searchInfo[key]]);
    		}

    		
    	}

    	const writable_props = ["searchInfo"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Info> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Info", $$slots, []);

    	$$self.$set = $$props => {
    		if ("searchInfo" in $$props) $$invalidate(2, searchInfo = $$props.searchInfo);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		searchInfo,
    		dispatch,
    		close,
    		info
    	});

    	$$self.$inject_state = $$props => {
    		if ("searchInfo" in $$props) $$invalidate(2, searchInfo = $$props.searchInfo);
    		if ("info" in $$props) $$invalidate(1, info = $$props.info);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [close, info, searchInfo];
    }

    class Info extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { searchInfo: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Info",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*searchInfo*/ ctx[2] === undefined && !("searchInfo" in props)) {
    			console_1$1.warn("<Info> was created without expected prop 'searchInfo'");
    		}
    	}

    	get searchInfo() {
    		throw new Error("<Info>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set searchInfo(value) {
    		throw new Error("<Info>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\HeaderComponent\Other.svelte generated by Svelte v3.19.2 */
    const file$5 = "src\\HeaderComponent\\Other.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[1] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[0] = i;
    	return child_ctx;
    }

    // (42:16) {#each sortByWhat as type, i }
    function create_each_block_1$1(ctx) {
    	let option;
    	let t_value = /*type*/ ctx[14] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*i*/ ctx[0];
    			option.value = option.__value;
    			add_location(option, file$5, 42, 16, 1253);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(42:16) {#each sortByWhat as type, i }",
    		ctx
    	});

    	return block;
    }

    // (50:16) {#each languageCode as code, l }
    function create_each_block$3(ctx) {
    	let option;
    	let t_value = /*code*/ ctx[12][0] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*l*/ ctx[1];
    			option.value = option.__value;
    			add_location(option, file$5, 50, 16, 1516);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(50:16) {#each languageCode as code, l }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div5;
    	let t0;
    	let div4;
    	let div1;
    	let div0;
    	let t2;
    	let select0;
    	let t3;
    	let div3;
    	let div2;
    	let t5;
    	let select1;
    	let current;
    	let dispose;
    	const button = new Button({ $$inline: true });
    	button.$on("set", /*set*/ ctx[2]);
    	button.$on("clear", /*clear*/ ctx[3]);
    	button.$on("close", /*close*/ ctx[4]);
    	let each_value_1 = /*sortByWhat*/ ctx[5];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*languageCode*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			create_component(button.$$.fragment);
    			t0 = space();
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "sort type:";
    			t2 = space();
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div2.textContent = "language";
    			t5 = space();
    			select1 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "svelte-1djcnpe");
    			add_location(div0, file$5, 39, 12, 1129);
    			if (/*i*/ ctx[0] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[10].call(select0));
    			add_location(select0, file$5, 40, 12, 1164);
    			attr_dev(div1, "class", "item svelte-1djcnpe");
    			add_location(div1, file$5, 38, 8, 1097);
    			attr_dev(div2, "class", "svelte-1djcnpe");
    			add_location(div2, file$5, 47, 12, 1392);
    			if (/*l*/ ctx[1] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[11].call(select1));
    			add_location(select1, file$5, 48, 12, 1425);
    			attr_dev(div3, "class", "item svelte-1djcnpe");
    			add_location(div3, file$5, 46, 8, 1360);
    			attr_dev(div4, "class", "other_container svelte-1djcnpe");
    			add_location(div4, file$5, 37, 4, 1058);
    			attr_dev(div5, "class", "header_open svelte-1djcnpe");
    			add_location(div5, file$5, 35, 0, 964);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			mount_component(button, div5, null);
    			append_dev(div5, t0);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t2);
    			append_dev(div1, select0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select0, null);
    			}

    			select_option(select0, /*i*/ ctx[0]);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div3, t5);
    			append_dev(div3, select1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			select_option(select1, /*l*/ ctx[1]);
    			current = true;

    			dispose = [
    				listen_dev(select0, "change", /*select0_change_handler*/ ctx[10]),
    				listen_dev(select1, "change", /*select1_change_handler*/ ctx[11])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*sortByWhat*/ 32) {
    				each_value_1 = /*sortByWhat*/ ctx[5];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*i*/ 1) {
    				select_option(select0, /*i*/ ctx[0]);
    			}

    			if (dirty & /*languageCode*/ 64) {
    				each_value = /*languageCode*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*l*/ 2) {
    				select_option(select1, /*l*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_component(button);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	const set = () => dispatch("set");
    	const clear = () => dispatch("clear");
    	const close = () => dispatch("close");
    	let { sortType } = $$props;
    	let { i } = $$props;
    	let sortByWhat = ["", "relevancy", "popularity", "publishedAt"];
    	
    	let { language } = $$props;
    	let { l } = $$props;
    	

    	let languageCode = [
    		["All", ""],
    		["Arabic", "ar"],
    		["German", "de"],
    		["English", "en"],
    		["Spanish", "es"],
    		["French", "fr"],
    		["Hebrew", "he"],
    		["Italian", "it"],
    		["Dutct", "nl"],
    		["Norwegian", "no"],
    		["Portuguese", "pt"],
    		["Russian", "ru"],
    		["Northern Sami", "se"],
    		["Chinese", "zh"]
    	];

    	const writable_props = ["sortType", "i", "language", "l"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Other> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Other", $$slots, []);

    	function select0_change_handler() {
    		i = select_value(this);
    		$$invalidate(0, i);
    	}

    	function select1_change_handler() {
    		l = select_value(this);
    		$$invalidate(1, l);
    	}

    	$$self.$set = $$props => {
    		if ("sortType" in $$props) $$invalidate(7, sortType = $$props.sortType);
    		if ("i" in $$props) $$invalidate(0, i = $$props.i);
    		if ("language" in $$props) $$invalidate(8, language = $$props.language);
    		if ("l" in $$props) $$invalidate(1, l = $$props.l);
    	};

    	$$self.$capture_state = () => ({
    		Button,
    		createEventDispatcher,
    		dispatch,
    		set,
    		clear,
    		close,
    		sortType,
    		i,
    		sortByWhat,
    		language,
    		l,
    		languageCode
    	});

    	$$self.$inject_state = $$props => {
    		if ("sortType" in $$props) $$invalidate(7, sortType = $$props.sortType);
    		if ("i" in $$props) $$invalidate(0, i = $$props.i);
    		if ("sortByWhat" in $$props) $$invalidate(5, sortByWhat = $$props.sortByWhat);
    		if ("language" in $$props) $$invalidate(8, language = $$props.language);
    		if ("l" in $$props) $$invalidate(1, l = $$props.l);
    		if ("languageCode" in $$props) $$invalidate(6, languageCode = $$props.languageCode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*i*/ 1) {
    			 if (i) {
    				$$invalidate(7, sortType = sortByWhat[i]);
    			}
    		}

    		if ($$self.$$.dirty & /*l*/ 2) {
    			 if (l) {
    				$$invalidate(8, language = languageCode[l][1]);
    			}
    		}
    	};

    	return [
    		i,
    		l,
    		set,
    		clear,
    		close,
    		sortByWhat,
    		languageCode,
    		sortType,
    		language,
    		dispatch,
    		select0_change_handler,
    		select1_change_handler
    	];
    }

    class Other extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { sortType: 7, i: 0, language: 8, l: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Other",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*sortType*/ ctx[7] === undefined && !("sortType" in props)) {
    			console.warn("<Other> was created without expected prop 'sortType'");
    		}

    		if (/*i*/ ctx[0] === undefined && !("i" in props)) {
    			console.warn("<Other> was created without expected prop 'i'");
    		}

    		if (/*language*/ ctx[8] === undefined && !("language" in props)) {
    			console.warn("<Other> was created without expected prop 'language'");
    		}

    		if (/*l*/ ctx[1] === undefined && !("l" in props)) {
    			console.warn("<Other> was created without expected prop 'l'");
    		}
    	}

    	get sortType() {
    		throw new Error("<Other>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sortType(value) {
    		throw new Error("<Other>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get i() {
    		throw new Error("<Other>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i(value) {
    		throw new Error("<Other>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get language() {
    		throw new Error("<Other>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set language(value) {
    		throw new Error("<Other>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get l() {
    		throw new Error("<Other>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set l(value) {
    		throw new Error("<Other>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\arrow.svelte generated by Svelte v3.19.2 */
    const file$6 = "src\\arrow.svelte";

    function create_fragment$6(ctx) {
    	let div6;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div3;
    	let div2;
    	let t2;
    	let div5;
    	let div4;
    	let dispose;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			t2 = space();
    			div5 = element("div");
    			div4 = element("div");
    			attr_dev(div0, "id", "leftpage");
    			attr_dev(div0, "class", "svelte-1bhxlzt");
    			toggle_class(div0, "inactive", /*isActive*/ ctx[0][0]);
    			add_location(div0, file$6, 9, 1, 244);
    			attr_dev(div1, "id", "rightpage");
    			attr_dev(div1, "class", "svelte-1bhxlzt");
    			toggle_class(div1, "inactive", /*isActive*/ ctx[0][/*isActive*/ ctx[0].length - 1]);
    			add_location(div1, file$6, 10, 1, 321);
    			attr_dev(div2, "class", "arrow svelte-1bhxlzt");
    			add_location(div2, file$6, 11, 46, 461);
    			attr_dev(div3, "id", "left");
    			attr_dev(div3, "class", "svelte-1bhxlzt");
    			toggle_class(div3, "inactive", /*isActive*/ ctx[0][0]);
    			add_location(div3, file$6, 11, 1, 416);
    			attr_dev(div4, "class", "arrow svelte-1bhxlzt");
    			add_location(div4, file$6, 12, 65, 559);
    			attr_dev(div5, "id", "right");
    			attr_dev(div5, "class", "svelte-1bhxlzt");
    			toggle_class(div5, "inactive", /*isActive*/ ctx[0][/*isActive*/ ctx[0].length - 1]);
    			add_location(div5, file$6, 12, 4, 498);
    			add_location(div6, file$6, 8, 0, 236);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div0);
    			append_dev(div6, t0);
    			append_dev(div6, div1);
    			append_dev(div6, t1);
    			append_dev(div6, div3);
    			append_dev(div3, div2);
    			append_dev(div6, t2);
    			append_dev(div6, div5);
    			append_dev(div5, div4);

    			dispose = [
    				listen_dev(div0, "click", /*turnLeft*/ ctx[2], false, false, false),
    				listen_dev(div1, "click", /*turnRight*/ ctx[1], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*isActive*/ 1) {
    				toggle_class(div0, "inactive", /*isActive*/ ctx[0][0]);
    			}

    			if (dirty & /*isActive*/ 1) {
    				toggle_class(div1, "inactive", /*isActive*/ ctx[0][/*isActive*/ ctx[0].length - 1]);
    			}

    			if (dirty & /*isActive*/ 1) {
    				toggle_class(div3, "inactive", /*isActive*/ ctx[0][0]);
    			}

    			if (dirty & /*isActive*/ 1) {
    				toggle_class(div5, "inactive", /*isActive*/ ctx[0][/*isActive*/ ctx[0].length - 1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { isActive } = $$props;
    	const dispatch = createEventDispatcher();
    	const turnRight = () => dispatch("turnRight");
    	const turnLeft = () => dispatch("turnLeft");
    	const writable_props = ["isActive"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Arrow> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Arrow", $$slots, []);

    	$$self.$set = $$props => {
    		if ("isActive" in $$props) $$invalidate(0, isActive = $$props.isActive);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		isActive,
    		dispatch,
    		turnRight,
    		turnLeft
    	});

    	$$self.$inject_state = $$props => {
    		if ("isActive" in $$props) $$invalidate(0, isActive = $$props.isActive);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isActive, turnRight, turnLeft];
    }

    class Arrow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { isActive: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Arrow",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*isActive*/ ctx[0] === undefined && !("isActive" in props)) {
    			console.warn("<Arrow> was created without expected prop 'isActive'");
    		}
    	}

    	get isActive() {
    		throw new Error("<Arrow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isActive(value) {
    		throw new Error("<Arrow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    //Input URL and return Articles as a json component.
    async function NewsApiLoader(url) {
        
        let item;
        let articles = [];
        item = await fetch(url).then(r => r.json());
        item = await item.articles;

        //If there is no box to get in information, it doesn't work...
        for (let i=0; i < item.length; i++) {
            articles[i] = 1;
        }

        for(let i=0;i < item.length; i++) {
            articles[i] = await item[i];
            //Cut the title's end like "- CNN.com"
            let title = articles[i].title;
            for (let j=title.length; j > 0; j--){
                if (title[j]=="-"){
                    articles[i].title = await title.slice(0, j);
                    break;
                }
            }
            //Get no-image.png if no image
            if(articles[i].urlToImage == null) {
                articles[i].urlToImage = "./image/no-image.png";
            }
            //Change .source to .source.name because deeper than one layer cannot be accessed...
            articles[i].source = await articles[i].source.name;
        }
        return articles;
    }



    //Input inputText and event binded to the <input> tag, then return new URL.
    function SearchUrl(inputText) {
        let search_url;
        let keywords;
        if (inputText.length==0){
            return null;
        }
        keywords = inputText.split(" ");
        search_url = "http://newsapi.org/v2/everything?q=";
        for (let i=0;i < keywords.length; i++){
            search_url += keywords[i] + "+";
        }
        search_url = search_url.slice(0,-1) + '&pageSize=100' + "&apiKey=5ccb5225a99744a3960174e417badf08";
        return search_url
    }

    //sourceLoad returns news sources as a dict. The data are in ./public/data/sources.json
    async function sourceLoad() {
        const sourceLoc = "./data/sources.json";
        let item = await fetch(sourceLoc).then(r => r.json());
        let sources = new Array();
        for(let i=0;i<150;i++) {
            if(item[i]){
                let info = {
                    checked: false,
                    name: item[i].name, 
                    source: item[i].source
                };
                sources.push(info);
            }
        }
        return sources;
    }

    //Get articles and break them into a list, num is a number of articles in one chunk.
    function MakeArticlesList(articles, num) {
        let articles_list = [];
        let i = 0;
        while(true) {
            if(i+num >= articles.length) {
                articles_list.push({ articles: articles.slice(i,), isActive: false });
                break;
            } else {
                articles_list.push({ articles: articles.slice(i, i+num), isActive: false});
            }
            i += num;
        }
        articles_list[0].isActive = true;
        console.log(articles_list);
        return articles_list;
    }

    /* src\App.svelte generated by Svelte v3.19.2 */

    const { console: console_1$2 } = globals;

    const file$7 = "src\\App.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[47] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[50] = list[i];
    	return child_ctx;
    }

    // (209:3) {#each categoryItems as item }
    function create_each_block_1$2(ctx) {
    	let div;
    	let t_value = /*item*/ ctx[50].type + "";
    	let t;
    	let div_id_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "category__item svelte-sh8ayq");
    			attr_dev(div, "id", div_id_value = /*item*/ ctx[50].type);
    			toggle_class(div, "category__item__active", /*item*/ ctx[50].isActive);
    			add_location(div, file$7, 209, 4, 5686);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			dispose = listen_dev(div, "click", /*toggleActiveItem*/ ctx[19], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*categoryItems*/ 1024 && t_value !== (t_value = /*item*/ ctx[50].type + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*categoryItems*/ 1024 && div_id_value !== (div_id_value = /*item*/ ctx[50].type)) {
    				attr_dev(div, "id", div_id_value);
    			}

    			if (dirty[0] & /*categoryItems*/ 1024) {
    				toggle_class(div, "category__item__active", /*item*/ ctx[50].isActive);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(209:3) {#each categoryItems as item }",
    		ctx
    	});

    	return block;
    }

    // (215:1) {#if articles_list}
    function create_if_block_7(ctx) {
    	let current;

    	const arrow = new Arrow({
    			props: {
    				isActive: /*articles_list*/ ctx[1].map(func)
    			},
    			$$inline: true
    		});

    	arrow.$on("turnRight", /*turnRight*/ ctx[14]);
    	arrow.$on("turnLeft", /*turnLeft*/ ctx[15]);

    	const block = {
    		c: function create() {
    			create_component(arrow.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(arrow, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const arrow_changes = {};
    			if (dirty[0] & /*articles_list*/ 2) arrow_changes.isActive = /*articles_list*/ ctx[1].map(func);
    			arrow.$set(arrow_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(arrow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(arrow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(arrow, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(215:1) {#if articles_list}",
    		ctx
    	});

    	return block;
    }

    // (225:38) 
    function create_if_block_6(ctx) {
    	let current;

    	const info = new Info({
    			props: { searchInfo: /*searchInfo*/ ctx[2] },
    			$$inline: true
    		});

    	info.$on("close", /*exitCategory*/ ctx[20]);

    	const block = {
    		c: function create() {
    			create_component(info.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(info, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const info_changes = {};
    			if (dirty[0] & /*searchInfo*/ 4) info_changes.searchInfo = /*searchInfo*/ ctx[2];
    			info.$set(info_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(info.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(info, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(225:38) ",
    		ctx
    	});

    	return block;
    }

    // (223:38) 
    function create_if_block_5(ctx) {
    	let updating_sortType;
    	let updating_i;
    	let updating_language;
    	let updating_l;
    	let current;

    	function other_sortType_binding(value) {
    		/*other_sortType_binding*/ ctx[43].call(null, value);
    	}

    	function other_i_binding(value) {
    		/*other_i_binding*/ ctx[44].call(null, value);
    	}

    	function other_language_binding(value) {
    		/*other_language_binding*/ ctx[45].call(null, value);
    	}

    	function other_l_binding(value) {
    		/*other_l_binding*/ ctx[46].call(null, value);
    	}

    	let other_props = {};

    	if (/*sortType*/ ctx[7] !== void 0) {
    		other_props.sortType = /*sortType*/ ctx[7];
    	}

    	if (/*sortTypeIndex*/ ctx[6] !== void 0) {
    		other_props.i = /*sortTypeIndex*/ ctx[6];
    	}

    	if (/*language*/ ctx[9] !== void 0) {
    		other_props.language = /*language*/ ctx[9];
    	}

    	if (/*languageIndex*/ ctx[8] !== void 0) {
    		other_props.l = /*languageIndex*/ ctx[8];
    	}

    	const other = new Other({ props: other_props, $$inline: true });
    	binding_callbacks.push(() => bind(other, "sortType", other_sortType_binding));
    	binding_callbacks.push(() => bind(other, "i", other_i_binding));
    	binding_callbacks.push(() => bind(other, "language", other_language_binding));
    	binding_callbacks.push(() => bind(other, "l", other_l_binding));
    	other.$on("close", /*exitCategory*/ ctx[20]);
    	other.$on("set", /*set*/ ctx[12]);
    	other.$on("clear", /*clearOthers*/ ctx[18]);

    	const block = {
    		c: function create() {
    			create_component(other.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(other, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const other_changes = {};

    			if (!updating_sortType && dirty[0] & /*sortType*/ 128) {
    				updating_sortType = true;
    				other_changes.sortType = /*sortType*/ ctx[7];
    				add_flush_callback(() => updating_sortType = false);
    			}

    			if (!updating_i && dirty[0] & /*sortTypeIndex*/ 64) {
    				updating_i = true;
    				other_changes.i = /*sortTypeIndex*/ ctx[6];
    				add_flush_callback(() => updating_i = false);
    			}

    			if (!updating_language && dirty[0] & /*language*/ 512) {
    				updating_language = true;
    				other_changes.language = /*language*/ ctx[9];
    				add_flush_callback(() => updating_language = false);
    			}

    			if (!updating_l && dirty[0] & /*languageIndex*/ 256) {
    				updating_l = true;
    				other_changes.l = /*languageIndex*/ ctx[8];
    				add_flush_callback(() => updating_l = false);
    			}

    			other.$set(other_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(other.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(other.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(other, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(223:38) ",
    		ctx
    	});

    	return block;
    }

    // (221:38) 
    function create_if_block_4(ctx) {
    	let updating_fromDate;
    	let updating_toDate;
    	let current;

    	function date_fromDate_binding(value) {
    		/*date_fromDate_binding*/ ctx[41].call(null, value);
    	}

    	function date_toDate_binding(value) {
    		/*date_toDate_binding*/ ctx[42].call(null, value);
    	}

    	let date_props = {};

    	if (/*fromDate*/ ctx[4] !== void 0) {
    		date_props.fromDate = /*fromDate*/ ctx[4];
    	}

    	if (/*toDate*/ ctx[5] !== void 0) {
    		date_props.toDate = /*toDate*/ ctx[5];
    	}

    	const date = new Date_1({ props: date_props, $$inline: true });
    	binding_callbacks.push(() => bind(date, "fromDate", date_fromDate_binding));
    	binding_callbacks.push(() => bind(date, "toDate", date_toDate_binding));
    	date.$on("set", /*set*/ ctx[12]);
    	date.$on("clear", /*clearDate*/ ctx[17]);
    	date.$on("close", /*exitCategory*/ ctx[20]);

    	const block = {
    		c: function create() {
    			create_component(date.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(date, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const date_changes = {};

    			if (!updating_fromDate && dirty[0] & /*fromDate*/ 16) {
    				updating_fromDate = true;
    				date_changes.fromDate = /*fromDate*/ ctx[4];
    				add_flush_callback(() => updating_fromDate = false);
    			}

    			if (!updating_toDate && dirty[0] & /*toDate*/ 32) {
    				updating_toDate = true;
    				date_changes.toDate = /*toDate*/ ctx[5];
    				add_flush_callback(() => updating_toDate = false);
    			}

    			date.$set(date_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(date.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(date.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(date, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(221:38) ",
    		ctx
    	});

    	return block;
    }

    // (219:1) {#if categoryItems[0].isActive }
    function create_if_block_3(ctx) {
    	let current;

    	const sources_1 = new Sources({
    			props: { sources: /*sources*/ ctx[11] },
    			$$inline: true
    		});

    	sources_1.$on("set", /*set*/ ctx[12]);
    	sources_1.$on("clear", /*clearSources*/ ctx[16]);
    	sources_1.$on("close", /*exitCategory*/ ctx[20]);

    	const block = {
    		c: function create() {
    			create_component(sources_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sources_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const sources_1_changes = {};
    			if (dirty[0] & /*sources*/ 2048) sources_1_changes.sources = /*sources*/ ctx[11];
    			sources_1.$set(sources_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sources_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sources_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sources_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(219:1) {#if categoryItems[0].isActive }",
    		ctx
    	});

    	return block;
    }

    // (236:1) {:else }
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Now Loading...";
    			add_location(p, file$7, 236, 2, 6771);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(236:1) {:else }",
    		ctx
    	});

    	return block;
    }

    // (229:1) {#if articles }
    function create_if_block$1(ctx) {
    	let t;
    	let each_1_anchor;
    	let current;
    	let if_block = /*articles*/ ctx[0].length == 0 && create_if_block_2(ctx);
    	let each_value = /*articles_list*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*articles*/ ctx[0].length == 0) {
    				if (!if_block) {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*articles_list*/ 2) {
    				each_value = /*articles_list*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(229:1) {#if articles }",
    		ctx
    	});

    	return block;
    }

    // (230:2) {#if articles.length == 0}
    function create_if_block_2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No Result";
    			add_location(p, file$7, 229, 28, 6613);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(230:2) {#if articles.length == 0}",
    		ctx
    	});

    	return block;
    }

    // (232:3) {#if a_list.isActive }
    function create_if_block_1(ctx) {
    	let current;

    	const articles_1 = new Articles({
    			props: { articles: /*a_list*/ ctx[47].articles },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(articles_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(articles_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const articles_1_changes = {};
    			if (dirty[0] & /*articles_list*/ 2) articles_1_changes.articles = /*a_list*/ ctx[47].articles;
    			articles_1.$set(articles_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(articles_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(articles_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(articles_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(232:3) {#if a_list.isActive }",
    		ctx
    	});

    	return block;
    }

    // (231:2) {#each articles_list as a_list }
    function create_each_block$4(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*a_list*/ ctx[47].isActive && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*a_list*/ ctx[47].isActive) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(231:2) {#each articles_list as a_list }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let main;
    	let header;
    	let input;
    	let t0;
    	let div0;
    	let t1;
    	let t2;
    	let current_block_type_index;
    	let if_block1;
    	let t3;
    	let current_block_type_index_1;
    	let if_block2;
    	let t4;
    	let footer;
    	let div1;
    	let t5;
    	let a;
    	let current;
    	let dispose;
    	let each_value_1 = /*categoryItems*/ ctx[10];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	let if_block0 = /*articles_list*/ ctx[1] && create_if_block_7(ctx);
    	const if_block_creators = [create_if_block_3, create_if_block_4, create_if_block_5, create_if_block_6];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*categoryItems*/ ctx[10][0].isActive) return 0;
    		if (/*categoryItems*/ ctx[10][1].isActive) return 1;
    		if (/*categoryItems*/ ctx[10][2].isActive) return 2;
    		if (/*categoryItems*/ ctx[10][3].isActive) return 3;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const if_block_creators_1 = [create_if_block$1, create_else_block];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*articles*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index_1 = select_block_type_1(ctx);
    	if_block2 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			header = element("header");
    			input = element("input");
    			t0 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if_block2.c();
    			t4 = space();
    			footer = element("footer");
    			div1 = element("div");
    			t5 = text("Powered by ");
    			a = element("a");
    			a.textContent = "News API";
    			attr_dev(input, "type", "search");
    			attr_dev(input, "placeholder", "Keywords");
    			attr_dev(input, "id", "search__input");
    			attr_dev(input, "class", "svelte-sh8ayq");
    			add_location(input, file$7, 206, 2, 5512);
    			attr_dev(div0, "class", "category svelte-sh8ayq");
    			add_location(div0, file$7, 207, 2, 5625);
    			attr_dev(header, "class", "svelte-sh8ayq");
    			add_location(header, file$7, 205, 1, 5501);
    			attr_dev(a, "href", "https://newsapi.org/");
    			add_location(a, file$7, 240, 37, 6848);
    			attr_dev(div1, "id", "link__newsapi");
    			attr_dev(div1, "class", "svelte-sh8ayq");
    			add_location(div1, file$7, 240, 2, 6813);
    			attr_dev(footer, "class", "svelte-sh8ayq");
    			add_location(footer, file$7, 239, 1, 6802);
    			add_location(main, file$7, 204, 0, 5493);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, header);
    			append_dev(header, input);
    			set_input_value(input, /*inputText*/ ctx[3]);
    			append_dev(header, t0);
    			append_dev(header, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(main, t1);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t2);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			append_dev(main, t3);
    			if_blocks_1[current_block_type_index_1].m(main, null);
    			append_dev(main, t4);
    			append_dev(main, footer);
    			append_dev(footer, div1);
    			append_dev(div1, t5);
    			append_dev(div1, a);
    			current = true;

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[40]),
    				listen_dev(input, "keydown", /*setKeyword*/ ctx[13], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*inputText*/ 8) {
    				set_input_value(input, /*inputText*/ ctx[3]);
    			}

    			if (dirty[0] & /*categoryItems, toggleActiveItem*/ 525312) {
    				each_value_1 = /*categoryItems*/ ctx[10];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (/*articles_list*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_7(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t2);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block1 = if_blocks[current_block_type_index];

    					if (!if_block1) {
    						if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block1.c();
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(main, t3);
    				} else {
    					if_block1 = null;
    				}
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_1(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    					if_blocks_1[previous_block_index_1] = null;
    				});

    				check_outros();
    				if_block2 = if_blocks_1[current_block_type_index_1];

    				if (!if_block2) {
    					if_block2 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    					if_block2.c();
    				}

    				transition_in(if_block2, 1);
    				if_block2.m(main, t4);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			if (if_block0) if_block0.d();

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if_blocks_1[current_block_type_index_1].d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function turnPage(list, RightOrLeft) {
    	let turn = RightOrLeft == "r" ? 1 : -1;

    	for (let i = 0; i < list.length; i++) {
    		if (list[i].isActive) {
    			list[i].isActive = false;
    			list[i + turn].isActive = true;
    			break;
    		}
    	}

    	return list;
    }

    const func = list => list.isActive;

    function instance$7($$self, $$props, $$invalidate) {
    	let url_everything = "https://newsapi.org/v2/everything?pageSize=96&";
    	let url_headline = "https://newsapi.org/v2/top-headlines?";

    	let url_keyword = keywords => {
    		let temp = keywords.reduce(
    			(url, keyword) => {
    				return `${url}${keyword}+`;
    			},
    			"q="
    		);

    		return temp.slice(0, -1) + "&";
    	};

    	let url_source = sources => {
    		let temp = sources.reduce(
    			(source, key) => {
    				return `${source}${key},`;
    			},
    			"sources="
    		);

    		return temp.slice(0, -1) + "&";
    	};

    	// let url_pageSize = (size) => { return `pageSize=${size}&` };
    	let url_language = language => {
    		return `language=${language}&`;
    	};

    	let url_date_from = from => {
    		return `from=${from}&`;
    	};

    	let url_date_to = to => {
    		return `to=${to}&`;
    	};

    	let url_sortBy = what => {
    		return `sortBy=${what}&`;
    	};

    	let apiKey = "apiKey=5ccb5225a99744a3960174e417badf08";
    	const default_url = url_headline + "country=us&" + apiKey;
    	let url;
    	let articles;
    	let articles_list;
    	let num = 12;

    	let searchInfo = {
    		keyword: false,
    		source: false,
    		// pageSize: "96",
    		language: false,
    		date_from: false,
    		date_to: false,
    		sortBy: false
    	};

    	function setUrl() {
    		//change url according to searchInfo
    		let keyword = searchInfo.keyword
    		? url_keyword(searchInfo.keyword)
    		: "";

    		let source = searchInfo.source ? url_source(searchInfo.source) : "";

    		// let pageSize = searchInfo.pageSize ? url_pageSize(searchInfo.pageSize) : "";
    		let language = searchInfo.language
    		? url_language(searchInfo.language)
    		: "";

    		let date_from = searchInfo.date_from
    		? url_date_from(searchInfo.date_from)
    		: "";

    		let date_to = searchInfo.date_to
    		? url_date_to(searchInfo.date_to)
    		: "";

    		let sortBy = searchInfo.sortBy ? url_sortBy(searchInfo.sortBy) : "";
    		let url_tail = keyword + source + language + date_from + date_to + sortBy;

    		$$invalidate(21, url = url_tail == ""
    		? default_url
    		: url_everything + url_tail + apiKey);

    		if (keyword == "" && source == "") {
    			alert("Sorry, Keyword or Source is required...");
    			return;
    		}

    		$$invalidate(0, articles = false);
    		$$invalidate(22, isUrlChanged = true);
    		console.log(url);
    	}

    	//set button
    	function set() {
    		setSource();
    		setKeyword();
    		setDate();
    		setOthers();
    		setUrl();
    	}

    	//Search by Keywords
    	let inputText;

    	function setKeyword(event) {
    		if (inputText == "" || inputText == undefined) {
    			$$invalidate(2, searchInfo["keyword"] = false, searchInfo);
    		} else {
    			let keywords = inputText.split(" ");
    			$$invalidate(2, searchInfo["keyword"] = keywords, searchInfo);
    		}

    		if (!event) return;
    		if (event.key == "Enter") set();
    	}

    	//Source
    	function setSource() {
    		let selected = sources.filter(source => source.checked).map(source => source.source);
    		$$invalidate(2, searchInfo["source"] = selected.length == 0 ? false : selected, searchInfo);
    	}

    	//Date
    	let fromDate = false;

    	let toDate = false;

    	function setDate() {
    		if (fromDate) $$invalidate(2, searchInfo["date_from"] = fromDate.length == 0 ? false : fromDate, searchInfo);
    		if (toDate) $$invalidate(2, searchInfo["date_to"] = toDate.length == 0 ? false : toDate, searchInfo);
    	}

    	//Other
    	let sortTypeIndex = 0;

    	let sortType;
    	let languageIndex = 0;
    	let language = "All";

    	function setOthers() {
    		$$invalidate(2, searchInfo["sortBy"] = sortType == "" ? false : sortType, searchInfo);
    		$$invalidate(2, searchInfo["language"] = language == "All" ? false : language, searchInfo);
    	}

    	//Update articles when url is changed.
    	let isUrlChanged = false;

    	function updateArticles(url) {
    		NewsApiLoader(url).then(data => {
    			$$invalidate(0, articles = data);
    			$$invalidate(1, articles_list = MakeArticlesList(articles, num));
    		});
    	}

    	//change display articles
    	function turnRight() {
    		$$invalidate(1, articles_list = turnPage(articles_list, "r"));
    	}

    	function turnLeft() {
    		$$invalidate(1, articles_list = turnPage(articles_list, "l"));
    	}

    	//Clear function
    	function clearSources() {
    		sources.forEach(source => {
    			source.checked = false;
    		});

    		$$invalidate(2, searchInfo["source"] = false, searchInfo);
    		$$invalidate(11, sources); //update and svelte reload...
    	} // url = default_url;
    	// isUrlChanged = true;

    	function clearDate() {
    		$$invalidate(5, toDate = false);
    		$$invalidate(4, fromDate = false);
    		$$invalidate(2, searchInfo["date_from"] = false, searchInfo);
    		$$invalidate(2, searchInfo["date_to"] = false, searchInfo);
    	}

    	function clearOthers() {
    		$$invalidate(6, sortTypeIndex = 0);
    		$$invalidate(7, sortType = false);
    		$$invalidate(2, searchInfo["sortBy"] = false, searchInfo);
    		$$invalidate(9, language = "All");
    		$$invalidate(8, languageIndex = 0);
    		$$invalidate(2, searchInfo["language"] = false, searchInfo);
    	}

    	//category treatment
    	let categoryItems = [
    		{ type: "source", isActive: false },
    		{ type: "date", isActive: false },
    		{ type: "others", isActive: false },
    		{ type: "info", isActive: false }
    	];

    	function toggleActiveItem() {
    		categoryItems.forEach(el => {
    			el.isActive = el.type == this.id
    			? el.isActive == true ? false : true
    			: false;
    		});

    		$$invalidate(10, categoryItems);
    	}

    	function exitCategory() {
    		categoryItems.forEach(el => {
    			el.isActive = false;
    		});

    		$$invalidate(10, categoryItems);
    	}

    	let sources;

    	function start() {
    		$$invalidate(21, url = default_url);

    		onMount(async () => {
    			$$invalidate(22, isUrlChanged = true);
    			$$invalidate(11, sources = await sourceLoad());
    		});
    	}

    	start();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function input_input_handler() {
    		inputText = this.value;
    		$$invalidate(3, inputText);
    	}

    	function date_fromDate_binding(value) {
    		fromDate = value;
    		$$invalidate(4, fromDate);
    	}

    	function date_toDate_binding(value) {
    		toDate = value;
    		$$invalidate(5, toDate);
    	}

    	function other_sortType_binding(value) {
    		sortType = value;
    		$$invalidate(7, sortType);
    	}

    	function other_i_binding(value) {
    		sortTypeIndex = value;
    		$$invalidate(6, sortTypeIndex);
    	}

    	function other_language_binding(value) {
    		language = value;
    		$$invalidate(9, language);
    	}

    	function other_l_binding(value) {
    		languageIndex = value;
    		$$invalidate(8, languageIndex);
    	}

    	$$self.$capture_state = () => ({
    		Articles,
    		Sources,
    		Date: Date_1,
    		Info,
    		Other,
    		Arrow,
    		onMount,
    		NewsApiLoader,
    		SearchUrl,
    		sourceLoad,
    		MakeArticlesList,
    		url_everything,
    		url_headline,
    		url_keyword,
    		url_source,
    		url_language,
    		url_date_from,
    		url_date_to,
    		url_sortBy,
    		apiKey,
    		default_url,
    		url,
    		articles,
    		articles_list,
    		num,
    		searchInfo,
    		setUrl,
    		set,
    		inputText,
    		setKeyword,
    		setSource,
    		fromDate,
    		toDate,
    		setDate,
    		sortTypeIndex,
    		sortType,
    		languageIndex,
    		language,
    		setOthers,
    		isUrlChanged,
    		updateArticles,
    		turnRight,
    		turnLeft,
    		turnPage,
    		clearSources,
    		clearDate,
    		clearOthers,
    		categoryItems,
    		toggleActiveItem,
    		exitCategory,
    		sources,
    		start
    	});

    	$$self.$inject_state = $$props => {
    		if ("url_everything" in $$props) url_everything = $$props.url_everything;
    		if ("url_headline" in $$props) url_headline = $$props.url_headline;
    		if ("url_keyword" in $$props) url_keyword = $$props.url_keyword;
    		if ("url_source" in $$props) url_source = $$props.url_source;
    		if ("url_language" in $$props) url_language = $$props.url_language;
    		if ("url_date_from" in $$props) url_date_from = $$props.url_date_from;
    		if ("url_date_to" in $$props) url_date_to = $$props.url_date_to;
    		if ("url_sortBy" in $$props) url_sortBy = $$props.url_sortBy;
    		if ("apiKey" in $$props) apiKey = $$props.apiKey;
    		if ("url" in $$props) $$invalidate(21, url = $$props.url);
    		if ("articles" in $$props) $$invalidate(0, articles = $$props.articles);
    		if ("articles_list" in $$props) $$invalidate(1, articles_list = $$props.articles_list);
    		if ("num" in $$props) num = $$props.num;
    		if ("searchInfo" in $$props) $$invalidate(2, searchInfo = $$props.searchInfo);
    		if ("inputText" in $$props) $$invalidate(3, inputText = $$props.inputText);
    		if ("fromDate" in $$props) $$invalidate(4, fromDate = $$props.fromDate);
    		if ("toDate" in $$props) $$invalidate(5, toDate = $$props.toDate);
    		if ("sortTypeIndex" in $$props) $$invalidate(6, sortTypeIndex = $$props.sortTypeIndex);
    		if ("sortType" in $$props) $$invalidate(7, sortType = $$props.sortType);
    		if ("languageIndex" in $$props) $$invalidate(8, languageIndex = $$props.languageIndex);
    		if ("language" in $$props) $$invalidate(9, language = $$props.language);
    		if ("isUrlChanged" in $$props) $$invalidate(22, isUrlChanged = $$props.isUrlChanged);
    		if ("categoryItems" in $$props) $$invalidate(10, categoryItems = $$props.categoryItems);
    		if ("sources" in $$props) $$invalidate(11, sources = $$props.sources);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*isUrlChanged, url*/ 6291456) {
    			 if (isUrlChanged) {
    				updateArticles(url);
    				$$invalidate(22, isUrlChanged = true);
    			}
    		}
    	};

    	return [
    		articles,
    		articles_list,
    		searchInfo,
    		inputText,
    		fromDate,
    		toDate,
    		sortTypeIndex,
    		sortType,
    		languageIndex,
    		language,
    		categoryItems,
    		sources,
    		set,
    		setKeyword,
    		turnRight,
    		turnLeft,
    		clearSources,
    		clearDate,
    		clearOthers,
    		toggleActiveItem,
    		exitCategory,
    		url,
    		isUrlChanged,
    		url_everything,
    		url_headline,
    		url_keyword,
    		url_source,
    		url_language,
    		url_date_from,
    		url_date_to,
    		url_sortBy,
    		apiKey,
    		default_url,
    		num,
    		setUrl,
    		setSource,
    		setDate,
    		setOthers,
    		updateArticles,
    		start,
    		input_input_handler,
    		date_fromDate_binding,
    		date_toDate_binding,
    		other_sortType_binding,
    		other_i_binding,
    		other_language_binding,
    		other_l_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		// name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
