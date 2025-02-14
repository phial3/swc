import a from "algoliasearch-helper";
import b from "./createWidgetsManager";
import c from "./createStore";
import { HIGHLIGHT_TAGS as d } from "./highlight";
import { hasMultipleIndices as e } from "./indexUtils";
import { version as f } from "react";
import g from "./version";
function h(a) {
    if (typeof a.addAlgoliaAgent === "function") {
        a.addAlgoliaAgent(`react (${f})`);
        a.addAlgoliaAgent(`react-instantsearch (${g})`);
    }
}
const i = (a)=>e({
        ais: a.props.contextValue,
        multiIndexContext: a.props.indexContextValue
    });
const j = (a, b)=>a.props.indexContextValue.targetedIndex === b;
const k = (a)=>Boolean(a.props.indexId);
const l = (a, b)=>a.props.indexId === b;
const m = (a, b)=>{
    const c = k(a);
    const d = k(b);
    if (c && !d) {
        return -1;
    }
    if (!c && d) {
        return 1;
    }
    return 0;
};
function n(a) {
    const b = (a)=>Object.prototype.toString.call(a) === "[object Object]" || Object.prototype.toString.call(a) === "[object Array]";
    const c = (a, ...b)=>{
        let c = 0;
        return a.replace(/%s/g, ()=>encodeURIComponent(b[c++]));
    };
    return Object.keys(a).map((d)=>c("%s=%s", d, b(a[d]) ? JSON.stringify(a[d]) : a[d])).join("&");
}
export default function o({ indexName: e , initialState: f = {} , searchClient: g , resultsState: o , stalledSearchDelay: q ,  }) {
    const r = a(g, e, {
        ...d
    });
    h(g);
    r.on("search", F).on("result", D({
        indexId: e
    })).on("error", E);
    let s = false;
    let t = null;
    let u = r.state;
    const v = b(K);
    G(g, o);
    const w = c({
        widgets: f,
        metadata: p(o),
        results: J(o),
        error: null,
        searching: false,
        isSearchStalled: true,
        searchingForFacetValues: false
    });
    function x() {
        s = true;
    }
    function y(a) {
        h(a);
        r.setClient(a);
        C();
    }
    function z() {
        r.clearCache();
        C();
    }
    function A(a) {
        return v.getWidgets().filter((a)=>Boolean(a.getMetadata)).map((b)=>b.getMetadata(a));
    }
    function B() {
        const a = v.getWidgets().filter((a)=>Boolean(a.getSearchParameters)).filter((a)=>!i(a) && !k(a)).reduce((a, b)=>b.getSearchParameters(a), u);
        const b = v.getWidgets().filter((a)=>Boolean(a.getSearchParameters)).filter((a)=>{
            const b = i(a) && j(a, e);
            const c = k(a) && l(a, e);
            return b || c;
        }).sort(m).reduce((a, b)=>b.getSearchParameters(a), a);
        const c = v.getWidgets().filter((a)=>Boolean(a.getSearchParameters)).filter((a)=>{
            const b = i(a) && !j(a, e);
            const c = k(a) && !l(a, e);
            return (b || c);
        }).sort(m).reduce((a, b)=>{
            const c = i(b) ? b.props.indexContextValue.targetedIndex : b.props.indexId;
            const d = a[c] || [];
            return {
                ...a,
                [c]: d.concat(b)
            };
        }, {});
        const d = Object.keys(c).map((b)=>({
                parameters: c[b].reduce((a, b)=>b.getSearchParameters(a), a),
                indexId: b
            }));
        return {
            mainParameters: b,
            derivedParameters: d
        };
    }
    function C() {
        if (!s) {
            const { mainParameters: a , derivedParameters: b  } = B(r.state);
            r.derivedHelpers.slice().forEach((a)=>{
                a.detach();
            });
            b.forEach(({ indexId: a , parameters: b  })=>{
                const c = r.derive(()=>b);
                c.on("result", D({
                    indexId: a
                })).on("error", E);
            });
            r.setState(a);
            r.search();
        }
    }
    function D({ indexId: a  }) {
        return (b)=>{
            const c = w.getState();
            const d = !r.derivedHelpers.length;
            let e = c.results ? c.results : {};
            e = !d && e.getFacetByName ? {} : e;
            if (!d) {
                e = {
                    ...e,
                    [a]: b.results
                };
            } else {
                e = b.results;
            }
            const f = w.getState();
            let g = f.isSearchStalled;
            if (!r.hasPendingRequests()) {
                clearTimeout(t);
                t = null;
                g = false;
            }
            const { resultsFacetValues: h , ...i } = f;
            w.setState({
                ...i,
                results: e,
                isSearchStalled: g,
                searching: false,
                error: null
            });
        };
    }
    function E({ error: a  }) {
        const b = w.getState();
        let c = b.isSearchStalled;
        if (!r.hasPendingRequests()) {
            clearTimeout(t);
            c = false;
        }
        const { resultsFacetValues: d , ...e } = b;
        w.setState({
            ...e,
            isSearchStalled: c,
            error: a,
            searching: false
        });
    }
    function F() {
        if (!t) {
            t = setTimeout(()=>{
                const { resultsFacetValues: a , ...b } = w.getState();
                w.setState({
                    ...b,
                    isSearchStalled: true
                });
            }, q);
        }
    }
    function G(a, b) {
        if (!b) {
            return;
        }
        if ((!a.transporter || a._cacheHydrated) && (!a._useCache || typeof a.addAlgoliaAgent !== "function")) {
            return;
        }
        if (a.transporter && !a._cacheHydrated) {
            a._cacheHydrated = true;
            const c = a.search;
            a.search = (b, ...d)=>{
                const e = b.map((a)=>({
                        ...a,
                        params: n(a.params)
                    }));
                return a.transporter.responsesCache.get({
                    method: "search",
                    args: [
                        e,
                        ...d
                    ]
                }, ()=>{
                    return c(b, ...d);
                });
            };
        }
        if (Array.isArray(b.results)) {
            H(a, b.results);
            return;
        }
        I(a, b);
    }
    function H(a, b) {
        if (a.transporter) {
            a.transporter.responsesCache.set({
                method: "search",
                args: [
                    b.reduce((a, b)=>a.concat(b.rawResults.map((a)=>({
                                indexName: a.index,
                                params: a.params
                            }))), []), 
                ]
            }, {
                results: b.reduce((a, b)=>a.concat(b.rawResults), [])
            });
            return;
        }
        const c = `/1/indexes/*/queries_body_${JSON.stringify({
            requests: b.reduce((a, b)=>a.concat(b.rawResults.map((a)=>({
                        indexName: a.index,
                        params: a.params
                    }))), [])
        })}`;
        a.cache = {
            ...a.cache,
            [c]: JSON.stringify({
                results: b.reduce((a, b)=>a.concat(b.rawResults), [])
            })
        };
    }
    function I(a, b) {
        if (a.transporter) {
            a.transporter.responsesCache.set({
                method: "search",
                args: [
                    b.rawResults.map((a)=>({
                            indexName: a.index,
                            params: a.params
                        })), 
                ]
            }, {
                results: b.rawResults
            });
            return;
        }
        const c = `/1/indexes/*/queries_body_${JSON.stringify({
            requests: b.rawResults.map((a)=>({
                    indexName: a.index,
                    params: a.params
                }))
        })}`;
        a.cache = {
            ...a.cache,
            [c]: JSON.stringify({
                results: b.rawResults
            })
        };
    }
    function J(b) {
        if (!b) {
            return null;
        }
        if (Array.isArray(b.results)) {
            return b.results.reduce((b, c)=>({
                    ...b,
                    [c._internalIndexId]: new a.SearchResults(new a.SearchParameters(c.state), c.rawResults)
                }), {});
        }
        return new a.SearchResults(new a.SearchParameters(b.state), b.rawResults);
    }
    function K() {
        const a = A(w.getState().widgets);
        w.setState({
            ...w.getState(),
            metadata: a,
            searching: true
        });
        C();
    }
    function L(a) {
        const b = w.getState().widgets;
        return v.getWidgets().filter((a)=>Boolean(a.transitionState)).reduce((a, c)=>c.transitionState(b, a), a);
    }
    function M(a) {
        const b = A(a);
        w.setState({
            ...w.getState(),
            widgets: a,
            metadata: b,
            searching: true
        });
        C();
    }
    function N({ facetName: a , query: b , maxFacetHits: c = 10  }) {
        const d = Math.max(1, Math.min(c, 100));
        w.setState({
            ...w.getState(),
            searchingForFacetValues: true
        });
        r.searchForFacetValues(a, b, d).then((c)=>{
            w.setState({
                ...w.getState(),
                error: null,
                searchingForFacetValues: false,
                resultsFacetValues: {
                    ...w.getState().resultsFacetValues,
                    [a]: c.facetHits,
                    query: b
                }
            });
        }, (a)=>{
            w.setState({
                ...w.getState(),
                searchingForFacetValues: false,
                error: a
            });
        }).catch((a)=>{
            setTimeout(()=>{
                throw a;
            });
        });
    }
    function O(a) {
        u = u.setIndex(a);
    }
    function P() {
        return w.getState().metadata.reduce((a, b)=>typeof b.id !== "undefined" ? a.concat(b.id) : a, []);
    }
    return {
        store: w,
        widgetsManager: v,
        getWidgetsIds: P,
        getSearchParameters: B,
        onSearchForFacetValues: N,
        onExternalStateUpdate: M,
        transitionState: L,
        updateClient: y,
        updateIndex: O,
        clearCache: z,
        skipSearch: x
    };
};
function p(a) {
    if (!a) {
        return [];
    }
    return a.metadata.map((a)=>({
            value: ()=>({}),
            ...a,
            items: a.items && a.items.map((a)=>({
                    value: ()=>({}),
                    ...a,
                    items: a.items && a.items.map((a)=>({
                            value: ()=>({}),
                            ...a
                        }))
                }))
        }));
}
