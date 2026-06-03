import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  MapPin,
  Navigation,
  Send,
  Sparkles,
  Star,
  Upload,
} from "lucide-react";

const weekDays = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

const fairTypes = [
  "Feira livre tradicional",
  "Feira orgânica",
  "Feira gastronômica",
  "Feira de artesanato",
  "Feira noturna",
];

const productOptions = [
  "Frutas",
  "Verduras e legumes",
  "Peixes",
  "Carnes",
  "Pastel",
  "Caldo de cana",
  "Comida pronta",
  "Flores e plantas",
  "Roupas",
  "Artesanato",
];

function App() {
  const [activePage, setActivePage] = useState("quick");
  const [submitted, setSubmitted] = useState(null);

  const pageMeta = useMemo(
    () =>
      activePage === "quick"
        ? {
            eyebrow: "Versão 1",
            title: "Cadastro rápido de feira",
            description:
              "Um formulário curto para captar o essencial sem transformar a colaboração em uma maratona.",
          }
        : {
            eyebrow: "Versão 2",
            title: "Complementar informações",
            description:
              "Um cadastro detalhado para validar localização, estrutura, produtos, avaliações e autorização de uso.",
          },
    [activePage]
  );

  function handleSubmit(event, label) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmitted({
      label,
      entries: Array.from(formData.entries()).length,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <MapPin size={22} aria-hidden="true" />
          </span>
          <div>
            <strong>Feiras de Rua</strong>
            <small>Cadastro colaborativo</small>
          </div>
        </div>

        <nav className="tabs" aria-label="Páginas do formulário">
          <button
            className={activePage === "quick" ? "active" : ""}
            onClick={() => setActivePage("quick")}
            type="button"
          >
            <ClipboardList size={18} aria-hidden="true" />
            Cadastro rápido
          </button>
          <button
            className={activePage === "complete" ? "active" : ""}
            onClick={() => setActivePage("complete")}
            type="button"
          >
            <FileText size={18} aria-hidden="true" />
            Complementar informações
          </button>
        </nav>

        <div className="sidebar-note">
          <Sparkles size={18} aria-hidden="true" />
          <span>A versão rápida é o ponto de entrada recomendado.</span>
        </div>
      </aside>

      <section className="content">
        <header className="page-header">
          <div>
            <span className="eyebrow">{pageMeta.eyebrow}</span>
            <h1>{pageMeta.title}</h1>
            <p>{pageMeta.description}</p>
          </div>
          <div className="status-pill">
            <Clock size={16} aria-hidden="true" />
            {activePage === "quick" ? "10 perguntas" : "Cadastro completo"}
          </div>
        </header>

        {submitted && (
          <div className="success-message" role="status">
            <CheckCircle2 size={20} aria-hidden="true" />
            <span>
              {submitted.label} recebido com {submitted.entries} respostas preenchidas.
            </span>
          </div>
        )}

        {activePage === "quick" ? (
          <QuickForm onSubmit={(event) => handleSubmit(event, "Cadastro rápido")} />
        ) : (
          <CompleteForm onSubmit={(event) => handleSubmit(event, "Cadastro completo")} />
        )}
      </section>
    </main>
  );
}

function QuickForm({ onSubmit }) {
  return (
    <form className="form-flow" onSubmit={onSubmit}>
      <FormSection icon={MapPin} title="Dados principais">
        <TextField name="nome_feira" label="Qual é o nome da feira?" required />
        <TextField
          name="localizacao"
          label="Onde fica a feira?"
          help="Informe rua, avenida, bairro ou ponto de referência."
          required
        />
        <TextField name="cidade_estado" label="Em qual cidade e estado fica essa feira?" required />
      </FormSection>

      <FormSection icon={Clock} title="Funcionamento">
        <CheckboxGroup
          name="dias"
          label="Em quais dias essa feira acontece?"
          options={[...weekDays, "Não sei"]}
        />
        <TextField name="horario" label="Qual é o horário de funcionamento?" placeholder="Das 7h às 13h" />
      </FormSection>

      <FormSection icon={ClipboardList} title="Tipo e produtos">
        <CheckboxGroup name="tipo_feira" label="Que tipo de feira é?" options={[...fairTypes, "Outra", "Não sei"]} />
        <CheckboxGroup name="produtos" label="O que costuma vender nessa feira?" options={[...productOptions, "Outros"]} />
      </FormSection>

      <FormSection icon={Star} title="Avaliação">
        <RatingField name="nota_geral" label="Qual nota você daria para essa feira?" />
        <TextArea
          name="comentario"
          label="Tem algo importante sobre essa feira?"
          help="Exemplo: boa para comprar peixe, muito cheia, difícil estacionar, preço bom etc."
        />
        <TextField name="contato" label="Seu nome ou contato, caso precisemos confirmar alguma informação." />
      </FormSection>

      <SubmitBar label="Enviar cadastro rápido" />
    </form>
  );
}

function CompleteForm({ onSubmit }) {
  return (
    <form className="form-flow" onSubmit={onSubmit}>
      <FormSection icon={ClipboardList} title="1. Identificação da feira">
        <TextField name="nome_feira" label="Nome da feira" required />
        <RadioGroup name="acontece_atualmente" label="A feira ainda acontece atualmente?" options={["Sim", "Não", "Não sei"]} />
        <CheckboxGroup
          name="tipo_feira"
          label="Tipo de feira"
          options={[...fairTypes, "Feira de produtores locais", "Feira de antiguidades"]}
          extraName="tipo_feira_outra"
          extraLabel="Outra"
        />
      </FormSection>

      <FormSection icon={MapPin} title="2. Localização detalhada">
        <TextField name="endereco" label="Endereço principal da feira" required />
        <div className="field-grid">
          <TextField name="bairro" label="Bairro" />
          <TextField name="cidade" label="Cidade" />
          <TextField name="estado" label="Estado" />
        </div>
        <TextField name="referencia" label="Ponto de referência" />
        <TextArea name="trechos" label="A feira ocupa quais ruas ou trechos?" />
        <TextField name="maps" label="Link do Google Maps, se tiver" inputMode="url" />
        <RadioGroup name="facil_mapa" label="É fácil encontrar a feira pelo mapa?" options={["Sim", "Não", "Mais ou menos"]} />
      </FormSection>

      <FormSection icon={Clock} title="3. Dia e horário">
        <CheckboxGroup name="dias" label="Em quais dias acontece?" options={weekDays} />
        <div className="field-grid">
          <TextField name="horario_inicio" label="Horário de início" />
          <TextField name="horario_termino" label="Horário de término" />
        </div>
        <RadioGroup
          name="melhor_horario"
          label="Melhor horário para ir"
          options={["Bem cedo", "Meio da manhã", "Perto do fim", "Depende do objetivo", "Não sei"]}
        />
        <TextArea name="observacao_horario" label="Observação sobre horário" />
      </FormSection>

      <FormSection icon={ClipboardList} title="4. Produtos vendidos">
        <CheckboxGroup
          name="produtos"
          label="Quais produtos são vendidos nessa feira?"
          options={[
            ...productOptions,
            "Ovos",
            "Temperos",
            "Doces",
            "Queijos",
            "Produtos naturais",
            "Produtos orgânicos",
            "Artigos usados",
          ]}
          extraName="produtos_outros"
          extraLabel="Outros"
        />
        <TextArea name="melhor_da_feira" label="O que essa feira tem de melhor?" />
        <TextArea name="barraca_recomendada" label="Tem alguma barraca famosa ou recomendada?" />
        <RadioGroup name="bons_precos" label="A feira tem bons preços?" options={["Sim", "Não", "Mais ou menos", "Depende do produto"]} />
      </FormSection>

      <FormSection icon={Star} title="5. Avaliação da feira">
        {[
          "Variedade de produtos",
          "Preço",
          "Qualidade dos produtos",
          "Limpeza",
          "Segurança",
          "Facilidade de acesso",
          "Organização da feira",
          "Atendimento dos feirantes",
          "Nota geral da feira",
        ].map((item) => (
          <ScaleField key={item} name={`avaliacao_${slug(item)}`} label={item} />
        ))}
      </FormSection>

      <FormSection icon={Navigation} title="6. Estrutura e acesso">
        <RadioGroup name="transporte_publico" label="É fácil chegar de transporte público?" options={["Sim", "Não", "Mais ou menos", "Não sei"]} />
        <CheckboxGroup name="transportes" label="Quais transportes chegam perto?" options={["Ônibus", "Metrô", "Trem", "Bicicleta", "Carro", "Não sei"]} />
        <RadioGroup name="estacionamento" label="Tem estacionamento por perto?" options={["Sim", "Não", "Difícil", "Não sei"]} />
        <RadioGroup name="movimento" label="A feira costuma ficar muito cheia?" options={["Pouco cheia", "Moderada", "Muito cheia", "Depende do horário"]} />
        <RadioGroup name="criancas" label="É boa para ir com criança?" options={["Sim", "Não", "Mais ou menos"]} />
        <RadioGroup name="mobilidade" label="É boa para idosos ou pessoas com mobilidade reduzida?" options={["Sim", "Não", "Mais ou menos", "Não sei"]} />
        <TextArea name="observacoes_acesso" label="Observações sobre acesso e estrutura" />
      </FormSection>

      <FormSection icon={Sparkles} title="7. Perfil da feira">
        <CheckboxGroup
          name="objetivo"
          label="Essa feira é melhor para qual objetivo?"
          options={[
            "Comprar barato",
            "Comprar produtos frescos",
            "Comer pastel/caldo de cana",
            "Comprar peixe",
            "Comprar orgânicos",
            "Passear",
            "Comprar flores",
            "Comprar roupas/artesanato",
            "Outro",
          ]}
        />
        <CheckboxGroup
          name="publico"
          label="Qual é o público mais comum?"
          options={["Moradores do bairro", "Famílias", "Idosos", "Trabalhadores da região", "Turistas", "Jovens", "Não sei"]}
        />
        <RadioGroup
          name="ritmo"
          label="A feira é mais tranquila ou movimentada?"
          options={["Tranquila", "Moderada", "Muito movimentada", "Depende do horário"]}
        />
      </FormSection>

      <FormSection icon={Upload} title="8. Fotos e comprovação">
        <FileField name="foto" label="Você pode enviar foto da feira, placa ou localização?" />
        <CheckboxGroup
          name="foto_mostra"
          label="A foto mostra o quê?"
          options={["Entrada da feira", "Barracas", "Placa/identificação", "Produtos", "Rua/localização", "Outro"]}
        />
        <CheckboxGroup
          name="conhecimento"
          label="Como você conhece essa feira?"
          options={["Moro perto", "Trabalho perto", "Sou cliente", "Sou feirante", "Vi na internet", "Outro"]}
        />
      </FormSection>

      <FormSection icon={FileText} title="9. Comentários e alertas">
        <TextArea name="antes_de_ir" label="O que uma pessoa precisa saber antes de ir nessa feira?" />
        <TextArea name="pontos_atencao" label="Tem algum problema ou ponto de atenção?" />
        <TextArea name="comentario_final" label="Comentário final" />
      </FormSection>

      <FormSection icon={CheckCircle2} title="10. Dados de quem preencheu">
        <TextField name="nome" label="Seu nome" />
        <CheckboxGroup
          name="perfil"
          label="Você é"
          options={["Cliente", "Morador da região", "Feirante", "Funcionário público", "Visitante ocasional", "Outro"]}
        />
        <TextField name="contato" label="WhatsApp ou e-mail" />
        <RadioGroup name="autoriza_contato" label="Você autoriza entrarmos em contato para confirmar informações?" options={["Sim", "Não"]} />
        <RadioGroup name="autoriza_uso" label="Você autoriza o uso das informações enviadas no site?" options={["Sim", "Não"]} />
      </FormSection>

      <SubmitBar label="Enviar informações completas" />
    </form>
  );
}

function FormSection({ icon: Icon, title, children }) {
  return (
    <section className="form-section">
      <div className="section-title">
        <span>
          <Icon size={18} aria-hidden="true" />
        </span>
        <h2>{title}</h2>
      </div>
      <div className="fields">{children}</div>
    </section>
  );
}

function TextField({ label, help, name, placeholder, required, inputMode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {help && <small>{help}</small>}
      <input name={name} placeholder={placeholder} required={required} inputMode={inputMode} />
    </label>
  );
}

function TextArea({ label, help, name }) {
  return (
    <label className="field">
      <span>{label}</span>
      {help && <small>{help}</small>}
      <textarea name={name} rows="4" />
    </label>
  );
}

function FileField({ label, name }) {
  return (
    <label className="field file-field">
      <span>{label}</span>
      <input name={name} type="file" accept="image/*" />
    </label>
  );
}

function CheckboxGroup({ label, name, options, extraName, extraLabel }) {
  return (
    <fieldset className="choice-field">
      <legend>{label}</legend>
      <div className="choice-grid">
        {options.map((option) => (
          <label key={option} className="choice">
            <input type="checkbox" name={name} value={option} />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {extraName && (
        <label className="inline-extra">
          <input type="checkbox" name={name} value={extraLabel} />
          <span>{extraLabel}</span>
          <input name={extraName} aria-label={`${extraLabel}: detalhe`} />
        </label>
      )}
    </fieldset>
  );
}

function RadioGroup({ label, name, options }) {
  return (
    <fieldset className="choice-field">
      <legend>{label}</legend>
      <div className="choice-grid compact">
        {options.map((option) => (
          <label key={option} className="choice">
            <input type="radio" name={name} value={option} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function RatingField({ label, name }) {
  return (
    <fieldset className="rating-field">
      <legend>{label}</legend>
      <div className="rating-options">
        {[1, 2, 3, 4, 5].map((value) => (
          <label key={value}>
            <input type="radio" name={name} value={value} />
            <span aria-hidden="true">{"★".repeat(value)}</span>
            <strong>{value}</strong>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ScaleField({ label, name }) {
  return (
    <fieldset className="scale-field">
      <legend>{label}</legend>
      <div className="scale-options">
        {[1, 2, 3, 4, 5].map((value) => (
          <label key={value}>
            <span>{value}</span>
            <input type="radio" name={name} value={value} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SubmitBar({ label }) {
  return (
    <div className="submit-bar">
      <button type="submit">
        <Send size={18} aria-hidden="true" />
        {label}
      </button>
    </div>
  );
}

function slug(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

createRoot(document.getElementById("root")).render(<App />);
