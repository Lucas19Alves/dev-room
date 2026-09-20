<script setup>
import BrandLogo from "./ui/BrandLogo.vue";
const props = defineProps({ page: { type: String, default: "privacy" } });
const privacy = props.page === "privacy";
</script>
<template>
  <main class="legal-page">
    <header>
      <a href="/" aria-label="Noma — início"><BrandLogo /></a
      ><a href="/">Voltar ao Noma</a>
    </header>
    <article>
      <p class="eyebrow">APP NA MANGA · BRASIL</p>
      <h1>{{ privacy ? "Política de Privacidade" : "Termos de Uso" }}</h1>
      <p class="legal-updated">Versão de 20 de setembro de 2026.</p>
      <template v-if="privacy"
        ><p>
          A App na Manga, desenvolvedora do Noma, trata seus dados para manter
          sua conta e ajudar você a conduzir seus objetivos. Esta política
          explica o que armazenamos, onde fica e como exercer seus direitos.
          Para falar conosco:
          <a href="mailto:appnamanga@gmail.com">appnamanga@gmail.com</a>.
        </p>
        <h2>Dados que você escolhe guardar</h2>
        <p>
          Nome, e-mail, autenticação e dados que escreve em seus Flows, como
          tarefas, registros, notas, materiais, etapas, metas e histórico. O
          conteúdo de cada Flow é privado por padrão. Publicar um modelo
          compartilha sua definição; o conteúdo pessoal é removido antes do
          envio.
        </p>
        <h2>Armazenamento e sincronização</h2>
        <p>
          Uma cópia local é guardada no navegador para permitir resposta
          imediata e uso offline. Quando você entra em uma conta e há conexão, a
          sincronização guarda uma cópia cifrada em trânsito em infraestrutura
          Supabase. A App na Manga não recebe sua senha. Conflitos entre
          dispositivos são apresentados para escolha, em vez de sobrescritos em
          silêncio.
        </p>
        <h2>Pagamentos</h2>
        <p>
          Se você contratar o Noma Pro quando a cobrança estiver ativa, o
          processador de pagamentos receberá os dados necessários ao pagamento e
          à assinatura. O Noma recebe o estado da assinatura para aplicar o
          plano. Não armazene dados de cartão nos seus Flows.
        </p>
        <h2>Uso e segurança</h2>
        <p>
          Usamos os dados para autenticar, sincronizar, manter o serviço,
          prevenir abuso e atender solicitações. Indicadores de produto, quando
          usados, guardam somente contagens agregadas neste dispositivo; não
          incluem o texto, o nome ou o conteúdo de seus Flows.
        </p>
        <h2>Retenção, exportação e exclusão</h2>
        <p>
          Você pode exportar seus dados pela área de conta e solicitar a
          exclusão da conta. A exclusão remove os dados de conta e publicações
          do serviço, encerra a assinatura quando aplicável e pode levar até 30
          dias para alcançar cópias operacionais. Registros fiscais sujeitos a
          obrigação legal podem ser retidos pelo período exigido. Cópias offline
          ficam nos navegadores de seus dispositivos e podem ser apagadas nas
          configurações do navegador.
        </p>
        <h2>Seus direitos</h2>
        <p>
          No Brasil, você pode solicitar acesso, correção, portabilidade ou
          eliminação, além de informações sobre o tratamento, pelo e-mail
          <a href="mailto:appnamanga@gmail.com">appnamanga@gmail.com</a>. Se a
          operação estiver sujeita à LGPD, essas solicitações serão atendidas
          conforme os prazos legais.
        </p>
        <h2>Controlador e contato</h2>
        <p>
          App na Manga · Brasil ·
          <a href="mailto:appnamanga@gmail.com">appnamanga@gmail.com</a>. A data
          acima identifica a versão desta política. Comunicaremos mudanças
          relevantes na própria aplicação ou por e-mail.
        </p></template
      >
      <template v-else
        ><p>
          Estes termos regulam o uso do Noma, desenvolvido pela App na Manga no
          Brasil. Ao criar uma conta ou usar o serviço, você concorda com estas
          condições. Dúvidas:
          <a href="mailto:appnamanga@gmail.com">appnamanga@gmail.com</a>.
        </p>
        <h2>O que o Noma oferece</h2>
        <p>
          O Noma ajuda a organizar objetivos em Flows: espaços com contexto,
          próximos passos e histórico. A disponibilidade pode depender de
          conexão, navegador, armazenamento do dispositivo e serviços de
          infraestrutura.
        </p>
        <h2>Conta e conteúdo</h2>
        <p>
          Informe dados corretos, mantenha seu acesso seguro e use o serviço de
          forma lícita. Seus registros privados pertencem a você. Você concede à
          App na Manga licença limitada para armazená-los e processá-los apenas
          para operar o Noma. Antes de compartilhar um modelo, confira o que
          será público. Não inclua dados de terceiros sem autorização.
        </p>
        <h2>Plano gratuito e Pro</h2>
        <p>
          O plano Free inclui até três Flows ativos; arquivar libera espaço e
          preserva os dados. O plano Pro será oferecido por R$ 19 por mês ou R$
          190 por ano, quando o checkout oficial estiver habilitado. A página
          segura de checkout mostrará impostos, renovação e as condições da
          cobrança antes da confirmação. A assinatura renova automaticamente até
          o cancelamento. Cancelar impede a próxima renovação; acesso Pro
          permanece até o fim do período pago.
        </p>
        <h2>Período após cancelamento</h2>
        <p>
          Se a conta voltar ao plano Free com mais de três Flows, nenhum dado
          será apagado. Você poderá acessar o conteúdo, arquivar os Flows que
          não usará ativamente e escolher quais ficam ativos. O Noma pode
          limitar novas ativações até essa escolha.
        </p>
        <h2>Uso responsável e disponibilidade</h2>
        <p>
          Não tente acessar dados de outros usuários, interferir na segurança,
          abusar de recursos ou publicar conteúdo ilegal. O Noma não substitui
          aconselhamento médico, jurídico, acadêmico ou financeiro profissional.
          O produto evolui; avisaremos sobre mudanças que afetem seu uso.
          Manutenções, falhas de rede ou de fornecedores podem interromper
          funções temporariamente.
        </p>
        <h2>Assinaturas e reembolso</h2>
        <p>
          O checkout exibirá o processador, o valor e as regras de cancelamento
          antes da compra. Pedidos de suporte e reembolso podem ser enviados
          para <a href="mailto:appnamanga@gmail.com">appnamanga@gmail.com</a>,
          sem prejuízo dos direitos do consumidor aplicáveis no Brasil.
        </p>
        <h2>Limitação e lei aplicável</h2>
        <p>
          Na extensão permitida em lei, a App na Manga não responde por perdas
          decorrentes de indisponibilidade externa, mau uso ou conteúdo que você
          decida compartilhar. Nada nestes termos reduz direitos previstos em
          lei. Aplica-se a legislação brasileira, respeitadas as regras de
          competência do consumidor.
        </p>
        <h2>Encerramento e contato</h2>
        <p>
          Você pode excluir sua conta pela área de conta. A App na Manga pode
          suspender acessos em caso de abuso ou risco à segurança, preservando
          os dados conforme a lei. App na Manga · Brasil ·
          <a href="mailto:appnamanga@gmail.com">appnamanga@gmail.com</a>.
        </p></template
      >
      <a href="/" class="legal-return">← Conhecer o Noma</a>
    </article>
    <footer>© {{ new Date().getFullYear() }} App na Manga · Noma</footer>
  </main>
</template>
<style scoped>
.legal-page {
  min-height: 100vh;
  background: var(--noma-canvas);
  color: var(--noma-ink);
  padding: 24px clamp(20px, 6vw, 90px);
}
.legal-page header,
.legal-page footer {
  max-width: 920px;
  margin: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.legal-page header > a:last-child,
.legal-page article a {
  color: var(--noma-brand);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.legal-page article {
  max-width: 760px;
  margin: 68px auto 80px;
}
.legal-page h1 {
  font-size: clamp(36px, 6vw, 56px);
  letter-spacing: -0.04em;
  margin: 18px 0;
}
.legal-updated {
  color: var(--noma-ink-muted);
  margin-bottom: 32px;
}
.legal-page article p {
  line-height: 1.8;
  color: var(--noma-ink-soft);
  margin: 14px 0;
}
.legal-page h2 {
  font-size: 22px;
  margin: 34px 0 8px;
}
.legal-return {
  display: inline-block;
  margin-top: 35px;
}
.legal-page footer {
  border-top: 1px solid var(--noma-border);
  padding-top: 18px;
  color: var(--noma-ink-muted);
  font-size: 13px;
}
</style>
