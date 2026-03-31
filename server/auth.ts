import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import type { PublicUser, User } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { createRateLimit } from "./rate-limit";

const PostgresStore = connectPg(session);
const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

type AuthenticatedUser = User & { accessibleEnteIds?: string[] };

function toPublicUser(user: AuthenticatedUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    role: user.role === "admin" ? "admin" : "operacional",
    enteId: user.enteId ?? null,
    accessibleEnteIds: user.accessibleEnteIds ?? (user.enteId ? [user.enteId] : []),
    canAccessAtaModule: Boolean(user.canAccessAtaModule),
    forcePasswordChange: Boolean(user.forcePasswordChange),
    createdAt: user.createdAt ?? null,
  };
}

function resolveSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret === "gestao-contratos-secret" || secret.length < 32) {
      throw new Error("SESSION_SECRET invalido para producao. Defina uma chave longa e aleatoria.");
    }
  }
  return secret || "gestao-contratos-secret";
}

export function setupAuth(app: Express) {
  const sessionSecret = resolveSessionSecret();
  const isProduction = app.get("env") === "production";
  const loginRateLimit = createRateLimit({
    windowMs: 15 * 60 * 1000,
    maxAttempts: 10,
    message: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.",
    keyPrefix: "login",
    getKey: (req) => `${req.ip}:${String(req.body?.email ?? "").trim().toLowerCase()}`,
  });

  const sessionSettings: session.SessionOptions = {
    name: "sigec.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new PostgresStore({
      pool,
      tableName: "session",
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Email ou senha incorretos" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, (user as User).id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        done(null, false);
        return;
      }
      const accessibleEnteIds = await storage.getUserEnteIds(user.id);
      done(null, { ...user, accessibleEnteIds });
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (_req, res) => {
    res.status(403).json({ message: "Cadastro publico desabilitado" });
  });

  app.post("/api/login", loginRateLimit, (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Erro no login" });
      req.session.regenerate((sessionErr) => {
        if (sessionErr) return next(sessionErr);
        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          storage.getUserEnteIds(user.id)
            .then((accessibleEnteIds) => {
              req.session.save((saveErr) => {
                if (saveErr) return next(saveErr);
                res.setHeader("Cache-Control", "no-store");
                res.status(200).json(toPublicUser({ ...user, accessibleEnteIds }));
              });
            })
            .catch(next);
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((destroyErr) => {
        if (destroyErr) return next(destroyErr);
        res.clearCookie("sigec.sid");
        res.status(200).json({ message: "Deslogado com sucesso" });
      });
    });
  });

  app.get("/api/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nao autorizado" });
    }
    res.setHeader("Cache-Control", "no-store");
    res.json(toPublicUser(req.user as AuthenticatedUser));
  });
}
