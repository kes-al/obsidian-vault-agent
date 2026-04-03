import { Modal, Setting } from "obsidian";

export class PromptModal extends Modal {
  private readonly titleText: string;
  private readonly placeholder: string;
  private readonly onSubmit: (value: string) => void;
  private value: string;

  constructor(app: App, titleText: string, placeholder: string, onSubmit: (value: string) => void) {
    super(app);
    this.titleText = titleText;
    this.placeholder = placeholder;
    this.onSubmit = onSubmit;
    this.value = "";
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.titleText });

    new Setting(contentEl)
      .setName("Input")
      .addText((text) => text.setPlaceholder(this.placeholder).onChange((value) => {
        this.value = value;
      }));

    new Setting(contentEl)
      .addButton((btn) =>
        btn.setButtonText("Cancel").onClick(() => {
          this.close();
        }))
      .addButton((btn) =>
        btn.setButtonText("Run").setCta().onClick(() => {
          this.onSubmit(this.value.trim());
          this.close();
        }));
  }
}

type App = import("obsidian").App;
