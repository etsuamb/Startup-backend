"use client";

import { useEffect } from "react";

const ERROR_ATTRIBUTE = "data-inline-validation-error";
const FIELD_KEY_ATTRIBUTE = "data-inline-validation-key";
let nextFieldId = 0;

const FILE_RULES = {
	image: {
		matches: (file) => ["image/jpeg", "image/png"].includes(file.type),
		message: "Please upload an image file in JPG or PNG format.",
	},
	pdf: {
		matches: (file) => file.type === "application/pdf",
		message: "Please upload a PDF document only.",
	},
	video: {
		matches: (file) => ["video/mp4", "video/quicktime", "video/webm"].includes(file.type),
		message: "Please upload a video file in MP4, MOV, or WebM format.",
	},
};

function validateFileField(field) {
	if (!(field instanceof HTMLInputElement) || field.type !== "file") return;
	const rule = FILE_RULES[field.dataset.fileKind];
	if (!rule) return;
	const files = Array.from(field.files || []);
	field.setCustomValidity(files.some((file) => !rule.matches(file)) ? rule.message : "");
}

function errorSelector(name) {
	return `[${ERROR_ATTRIBUTE}="${CSS.escape(name)}"]`;
}

function fieldKey(field) {
	const existingKey = field.getAttribute(FIELD_KEY_ATTRIBUTE);
	if (existingKey) return existingKey;

	const key =
		field.type === "radio" && field.name
			? `radio-${field.name}`
			: `field-${nextFieldId++}`;
	field.setAttribute(FIELD_KEY_ATTRIBUTE, key);
	return key;
}

function clearFieldError(field) {
	const form = field.form;
	if (!form) return;
	const key = fieldKey(field);
	form.querySelector(errorSelector(key))?.remove();
	form.querySelectorAll(`[${FIELD_KEY_ATTRIBUTE}="${CSS.escape(key)}"]`).forEach((item) => {
		item.removeAttribute("aria-invalid");
	});
}

function showFieldError(field) {
	const form = field.form;
	if (!form || field.validity.valid) {
		clearFieldError(field);
		return;
	}

	const key = fieldKey(field);
	let message = form.querySelector(errorSelector(key));
	if (!message) {
		message = document.createElement("p");
		message.setAttribute(ERROR_ATTRIBUTE, key);
		message.setAttribute("role", "alert");
		message.className = "mt-2 text-xs font-semibold text-red-600";
		field.insertAdjacentElement("afterend", message);
	}

	field.setAttribute("aria-invalid", "true");
	message.textContent = field.validationMessage || "Please enter a valid value.";
}

function invalidFields(form) {
	return Array.from(form.elements).filter(
		(field) => field instanceof HTMLElement && field.willValidate && !field.validity.valid,
	);
}

function configureForms(root = document) {
	root.querySelectorAll("form").forEach((form) => {
		form.noValidate = true;
	});
}

export default function InlineFormValidation() {
	useEffect(() => {
		configureForms();

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					if (!(node instanceof HTMLElement)) return;
					if (node.matches("form")) node.noValidate = true;
					configureForms(node);
				});
			});
		});

		function onSubmit(event) {
			if (!(event.target instanceof HTMLFormElement)) return;
			const fields = invalidFields(event.target);
			if (fields.length === 0) return;

			event.preventDefault();
			event.stopPropagation();
			fields.forEach(showFieldError);
			fields[0].focus();
		}

		function onFieldUpdate(event) {
			const field = event.target;
			if (!(field instanceof HTMLElement) || !field.form || !field.willValidate) return;
			validateFileField(field);
			if (field.validity.valid) {
				clearFieldError(field);
			} else if (field instanceof HTMLInputElement && field.type === "file") {
				showFieldError(field);
			} else if (field.getAttribute("aria-invalid") === "true") {
				showFieldError(field);
			}
		}

		document.addEventListener("submit", onSubmit, true);
		document.addEventListener("input", onFieldUpdate, true);
		document.addEventListener("change", onFieldUpdate, true);
		observer.observe(document.body, { childList: true, subtree: true });

		return () => {
			document.removeEventListener("submit", onSubmit, true);
			document.removeEventListener("input", onFieldUpdate, true);
			document.removeEventListener("change", onFieldUpdate, true);
			observer.disconnect();
		};
	}, []);

	return null;
}
