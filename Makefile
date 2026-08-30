# Template Mobile — points d'entrée du projet.
# Compatible GNU Make 3.81 (make Apple). `make help` liste les cibles.

.DEFAULT_GOAL := help
SHELL := /bin/bash

.PHONY: help setup doctor clean-install dev dev-fast dev-debug ios android web \
	lint format format-check typecheck check \
	test test-watch test-coverage \
	prebuild build-ios build-android \
	clean clean-cache upgrade

help: ## Affiche cette aide
	@awk 'BEGIN { FS = ":.*##" } \
		/^##@/ { printf "\n\033[1;33m%s\033[0m\n", substr($$0, 5) } \
		/^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2 }' \
		$(MAKEFILE_LIST)

##@ SETUP

setup: ## Installe les deps (npm ci) et genere les types expo-router
	npm ci
	npm run typegen

doctor: ## Diagnostic de l'environnement Expo
	npx expo-doctor

clean-install: ## Reinstallation propre (rm -rf node_modules + npm ci)
	rm -rf node_modules
	npm ci

##@ DEV

# Profils de ressources : METRO_MAX_WORKERS est lu par metro.config.js. On ne pose
# PAS de NODE_OPTIONS ailleurs que sur dev-fast : sur un poste 48 Go le heap V8 par
# defaut vaut deja ~4144 Mo, donc --max-old-space-size=4096 ne borne rien et serait
# hérité par tous les node enfants (y compris ceux lances par Xcode via `make ios`).
dev: ## Lance le dev server Expo (profil sobre : 4 workers)
	METRO_MAX_WORKERS=4 npx expo start

dev-fast: ## Dev server pleine charge (10 workers, heap 8 Go) — Metro seul au premier plan
	METRO_MAX_WORKERS=10 NODE_OPTIONS=--max-old-space-size=8192 npx expo start

dev-debug: ## Dev server mono-worker (transformation in-band, stack traces lisibles)
	METRO_MAX_WORKERS=1 npx expo start

ios: ## Build + run sur simulateur iOS (bundler en profil sobre)
	METRO_MAX_WORKERS=4 npx expo run:ios

android: ## Build + run sur emulateur Android (bundler en profil sobre)
	METRO_MAX_WORKERS=4 npx expo run:android

web: ## Lance le dev server en mode web
	npx expo start --web

##@ QUALITY

lint: ## Lint (eslint via expo lint)
	npm run lint

format: ## Formate tout le repo (prettier --write)
	npm run format

format-check: ## Verifie le formatage sans ecrire
	npm run format:check

typecheck: ## Typecheck strict (tsc --noEmit)
	npm run typecheck

check: lint typecheck test ## Lint + typecheck + tests

##@ TEST

test: ## Lance les tests (jest)
	npm test

test-watch: ## Tests en mode watch
	npm run test:watch

test-coverage: ## Tests avec rapport de couverture
	npm run test:coverage

##@ BUILD

prebuild: ## Genere les projets natifs (expo prebuild)
	npx expo prebuild

build-ios: ## Build EAS iOS (requiert eas.json + compte EAS)
	@echo "EAS non configure dans ce template (pas de eas.json)."
	@echo "Quand pret : npx eas build --platform ios"

build-android: ## Build EAS Android (requiert eas.json + compte EAS)
	@echo "EAS non configure dans ce template (pas de eas.json)."
	@echo "Quand pret : npx eas build --platform android"

##@ MAINTENANCE

clean: ## Purge caches (.expo/cache, .expo/web, node_modules/.cache)
# On ne supprime PAS .expo en entier : .expo/types/router.d.ts porte les routes
# typees expo-router et son absence casse `npm run typecheck`.
	rm -rf .expo/cache .expo/web node_modules/.cache

clean-cache: ## Purge les seuls caches transformer (metro + jest)
	rm -rf node_modules/.cache/metro node_modules/.cache/jest

upgrade: ## Aligne les deps sur le SDK Expo (expo install --fix)
	npx expo install --fix
