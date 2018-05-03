import React from "react";
import { app, i18n, resolveMiddleware, renderMiddleware, Router } from "webiny-app";
import { app as adminApp, Menu } from "webiny-app-admin";
import { app as securityApp, authenticationMiddleware } from "webiny-app-security";
import { app as securityAdminApp } from "webiny-app-security/lib/admin";
import { app as cmsAdminApp } from "webiny-app-cms/lib/admin";
import userIdentity from "./userIdentity";
import { hot } from "react-hot-loader";

const t = i18n.namespace(`AdminApp`);

if (!app.initialized) {
    app.use(adminApp());
    app.use(
        securityApp({
            authentication: {
                cookie: "webiny-token",
                // TODO: define strategies like on server side
                identities: [userIdentity],
                onLogout() {
                    app.router.goToRoute("Login");
                }
            }
        })
    );
    app.use(securityAdminApp({ manager: true }));
    app.use(cmsAdminApp());

    app.use((params, next) => {
        app.services.get("menu").add(
            <Menu order="0" label={t`Dashboard`} icon="home">
                <Menu order="0" label={t`My Account`} route="Homepage" />
                <Menu order="1" label={t`Settings`} route="Homepage" />
            </Menu>
        );

        app.router.addRoute({
            name: "Contact",
            path: "/contact/:id",
            component: () => import("./views/Contact").then(m => m.default)
        });

        app.router.addRoute({
            name: "Profile",
            path: "/about/:id",
            component: () => import("./views/Profile").then(m => m.default)
        });

        app.router.addRoute({
            name: "Dashboard",
            path: "/about",
            render() {
                return import("./views/About").then(m => {
                    return React.createElement(m.default);
                });
            }
        });

        app.router.addRoute({
            name: "Homepage",
            exact: true,
            path: "/",
            render() {
                return (
                    <div>
                        <h1>{t`Homepage`}</h1>
                        <a href={"/admin/about"}>{t`About`}</a>
                    </div>
                );
            }
        });

        app.router.addRoute({
            name: "NotMatched",
            path: "*",
            render() {
                return (
                    <div>
                        <h1>{t`404 Not Found`}</h1>
                        <a href={"/"}>{t`Get me out of here`}</a>
                    </div>
                );
            }
        });

        next();
    });

    app.configure(() => {
        app.graphql.setConfig({
            uri: "http://localhost:9000/graphql",
            defaultOptions: {
                watchQuery: {
                    fetchPolicy: "network-only",
                    errorPolicy: "all"
                },
                query: {
                    fetchPolicy: "network-only",
                    errorPolicy: "all"
                }
            }
        });
    });

    app.router.configure({
        basename: "/admin",
        middleware: [
            authenticationMiddleware({
                onNotAuthenticated({ route }, next) {
                    if (route.name !== "Login") {
                        app.router.goToRoute("Login");
                    }
                    next();
                }
            }),
            resolveMiddleware(),
            renderMiddleware()
        ]
    });
}

const App = () => {
    return <Router router={app.router} />;
};

export default hot(module)(App);