/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

interface Env {
	AI: any;
}

export default {
	fetch: async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
		if (request.method === 'POST') {
			const formData = await request.formData();
			const userMessage = formData.get('message') as string;

			const aiResponse = await getAIResponse(userMessage, env);

			return new Response(aiResponse, {
				headers: { 'Content-Type': 'text/plain' },
			});
		}

		const html = `
			<!DOCTYPE html>
			<html lang="uk">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>AI Чат</title>
				<style>
					body {
						display: flex;
						flex-direction: column;
						justify-content: center;
						align-items: center;
						height: 100vh;
						margin: 0;
						font-family: Arial, sans-serif;
						background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
						color: white;
					}
					h1 {
						margin-bottom: 20px;
						text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
					}
					#chat-container {
						width: 300px;
						height: 400px;
						border: 1px solid rgba(255,255,255,0.3);
						border-radius: 10px;
						overflow-y: auto;
						margin-bottom: 10px;
						padding: 10px;
						background-color: rgba(255,255,255,0.1);
						backdrop-filter: blur(5px);
					}
					#message-form {
						display: flex;
					}
					#message-input {
						flex-grow: 1;
						padding: 10px;
						font-size: 16px;
						border: none;
						border-radius: 5px 0 0 5px;
						background-color: rgba(255,255,255,0.2);
						color: white;
					}
					#message-input::placeholder {
						color: rgba(255,255,255,0.7);
					}
					button {
						padding: 10px;
						font-size: 16px;
						border: none;
						border-radius: 0 5px 5px 0;
						background-color: #4a5568;
						color: white;
						cursor: pointer;
						transition: background-color 0.3s;
					}
					button:hover {
						background-color: #2d3748;
					}
					.spinner {
						display: inline-block;
						width: 20px;
						height: 20px;
						border: 3px solid rgba(255,255,255,.3);
						border-radius: 50%;
						border-top-color: #fff;
						animation: spin 1s ease-in-out infinite;
						margin-left: 10px;
					}
					@keyframes spin {
						to { transform: rotate(360deg); }
					}
				</style>
			</head>
			<body>
				<h1>AI Чат</h1>
				<div id="chat-container"></div>
				<form id="message-form">
					<input type="text" id="message-input" placeholder="Введіть повідомлення">
					<button type="submit">Надіслати</button>
				</form>
				<script>
					const chatContainer = document.getElementById('chat-container');
					const messageForm = document.getElementById('message-form');
					const messageInput = document.getElementById('message-input');

					messageForm.addEventListener('submit', async (e) => {
						e.preventDefault();
						const message = messageInput.value.trim();
						if (message) {
							addMessage('Ви: ' + message);
							messageInput.value = '';

							const spinner = addSpinner();
							
							const formData = new FormData();
							formData.append('message', message);

							try {
								const response = await fetch('/', {
									method: 'POST',
									body: formData
								});
								const aiResponse = await response.text();
								removeSpinner(spinner);
								addMessage('AI: ' + aiResponse);
							} catch (error) {
								removeSpinner(spinner);
								addMessage('AI: Вибачте, сталася помилка. Спробуйте ще раз.');
							}
						}
					});

					function addMessage(message) {
						const messageElement = document.createElement('p');
						messageElement.textContent = message;
						chatContainer.appendChild(messageElement);
						chatContainer.scrollTop = chatContainer.scrollHeight;
					}

					function addSpinner() {
						const spinnerElement = document.createElement('div');
						spinnerElement.className = 'spinner';
						chatContainer.appendChild(spinnerElement);
						chatContainer.scrollTop = chatContainer.scrollHeight;
						return spinnerElement;
					}

					function removeSpinner(spinner) {
						if (spinner && spinner.parentNode) {
							spinner.parentNode.removeChild(spinner);
						}
					}
				</script>
			</body>
			</html>
		`;

		return new Response(html, {
			headers: { 'Content-Type': 'text/html' },
		});
	},
};

async function getAIResponse(message: string, env: Env): Promise<string> {
	if (!env.AI) {
		console.error('AI binding is not available');
		return 'Вибачте, AI зараз недоступний. Спробуйте пізніше.';
	}

	try {
		const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
			messages: [{ role: 'user', content: message }],
			stream: false,
		});
		return response.response;
	} catch (error) {
		console.error('Error calling AI:', error);
		return 'Вибачте, сталася помилка при обробці вашого запиту.';
	}
}
