import type { AnswerBot, RequestForm } from "./data-types";
import { Fragment, useCallback, useEffect, useState } from "react";
import { TicketFormField } from "./ticket-form-field/TicketFormField";
import { ParentTicketField } from "./parent-ticket-field/ParentTicketField";
import { Anchor, Button } from "@zendeskgarden/react-buttons";
import styled from "styled-components";
import { Alert } from "@zendeskgarden/react-notifications";
import { useFormSubmit } from "./useFormSubmit";
import { usePrefilledTicketFields } from "./usePrefilledTicketFields";
import { Attachments } from "./fields/attachments/Attachments";
import { getVisibleFields } from "../ticket-fields/getVisibleFields";
import { CcField } from "./fields/cc-field/CcField";
import { SuggestedArticles } from "./suggested-articles/SuggestedArticles";
import { AnswerBotModal } from "./answer-bot-modal/AnswerBotModal";
import { useTranslation } from "react-i18next";
import { Paragraph } from "@zendeskgarden/react-typography";
import { DropDown, Input, TextArea, RequestFormField } from "../ticket-fields";
import type { Organization } from "../ticket-fields/data-types/Organization";
import type { TicketFieldObject } from "../ticket-fields/data-types/TicketFieldObject";
import { GenerativeAnswerBotModal } from "./answer-bot-generative-modal/GenerativeAnswerBotModal";

export interface NewRequestFormProps {
  requestForm: RequestForm;
  wysiwyg: boolean;
  newRequestPath: string;
  parentId: string;
  parentIdPath: string;
  locale: string;
  baseLocale: string;
  hasAtMentions: boolean;
  userRole: string;
  userId: number;
  brandId: number;
  organizations: Array<Organization>;
  answerBotModal: {
    answerBot: AnswerBot;
    hasRequestManagement: boolean;
    isSignedIn: boolean;
    helpCenterPath: string;
    requestsPath: string;
    requestPath: string;
  };
}

const StyledParagraph = styled(Paragraph)`
  margin: ${(props) => props.theme.space.md} 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.space.md};
`;

const Footer = styled.div`
  margin-top: ${(props) => props.theme.space.md};
`;

export function NewRequestForm({
  requestForm,
  wysiwyg,
  newRequestPath,
  parentId,
  parentIdPath,
  locale,
  baseLocale,
  hasAtMentions,
  userRole,
  userId,
  brandId,
  organizations,
  answerBotModal,
}: NewRequestFormProps) {
  const {
    ticket_fields,
    action,
    http_method,
    accept_charset,
    errors,
    parent_id_field,
    ticket_form_field,
    email_field,
    cc_field,
    organization_field,
    due_date_field,
    end_user_conditions,
    attachments_field,
    inline_attachments_fields,
    description_mimetype_field,
  } = requestForm;
  const { answerBot } = answerBotModal;
  const {
    ticketFields: prefilledTicketFields,
    emailField,
    ccField,
    organizationField: prefilledOrganizationField,
    dueDateField: prefilledDueDateField,
  } = usePrefilledTicketFields({
    ticketFields: ticket_fields,
    emailField: email_field,
    ccField: cc_field,
    organizationField: organization_field,
    dueDateField: due_date_field,
  });
  const [ticketFields, setTicketFields] = useState(prefilledTicketFields);
  const [organizationField, setOrganizationField] = useState(
    prefilledOrganizationField
  );
  const [dueDateField, setDueDateField] = useState(prefilledDueDateField);
  const visibleFields = getVisibleFields(ticketFields, end_user_conditions);
  const { formRefCallback, handleSubmit } = useFormSubmit(ticketFields);
  const { t } = useTranslation();
  const defaultOrganizationId =
    organizations.length > 0 && organizations[0]?.id
      ? organizations[0]?.id?.toString()
      : null;

  const handleChange = useCallback(
    (field: TicketFieldObject, value: TicketFieldObject["value"]) => {
      setTicketFields(
        ticketFields.map((ticketField) =>
          ticketField.name === field.name
            ? { ...ticketField, value }
            : ticketField
        )
      );
    },
    [ticketFields]
  );

  function handleOrganizationChange(value: string) {
    if (organizationField === null) {
      return;
    }

    setOrganizationField({ ...organizationField, value });
  }

  const handleDueDateChange = useCallback(
    (value: string) => {
      if (dueDateField === null) {
        return;
      }

      setDueDateField({ ...dueDateField, value });
    },
    [dueDateField]
  );

  const answerBotModalEnabled =
    !!answerBot?.auth_token &&
    !!answerBot?.interaction_access_token &&
    !!answerBot?.articles?.length &&
    !!answerBot?.request_id;

  const answerBotGenerativeModalEnabled =
    !answerBotModalEnabled && answerBot.request_id;

  // Get the selected ticket form name and set it as the subject field value
  useEffect(() => {
    if (ticket_form_field.value) {
      const selectedForm = ticket_form_field.options.find(
        (option) => option.value === String(ticket_form_field.value)
      );
      if (selectedForm) {
        setTicketFields((prevFields) => {
          const subjectField = prevFields.find((field) => field.type === "subject");
          if (subjectField && subjectField.value !== selectedForm.name) {
            return prevFields.map((field) =>
              field.name === subjectField.name
                ? { ...field, value: selectedForm.name }
                : field
            );
          }
          return prevFields;
        });
      }
    }
  }, [ticket_form_field.value, ticket_form_field.options]);

  return (
    <>
      {parentId && (
        <StyledParagraph>
          <Anchor href={parentIdPath}>
            {t(
              "new-request-form.parent-request-link",
              "Follow-up to request {{parentId}}",
              {
                parentId: `\u202D#${parentId}\u202C`,
              }
            )}
          </Anchor>
        </StyledParagraph>
      )}
      <StyledParagraph aria-hidden="true">
        {t(
          "new-request-form.required-fields-info",
          "Fields marked with an asterisk (*) are required."
        )}
      </StyledParagraph>
      <Form
        ref={formRefCallback}
        action={action}
        method={http_method}
        acceptCharset={accept_charset}
        noValidate
        onSubmit={handleSubmit}
      >
        {errors && <Alert type="error">{errors}</Alert>}
        {parent_id_field && <ParentTicketField field={parent_id_field} />}
        {ticket_form_field.options.length > 0 && (
          <TicketFormField
            field={ticket_form_field}
            newRequestPath={newRequestPath}
          />
        )}
        {emailField && <Input key={emailField.name} field={emailField} />}
        {ccField && <CcField field={ccField} />}
        {organizationField && (
          <DropDown
            key={organizationField.name}
            field={organizationField}
            onChange={(value) => {
              handleOrganizationChange(value);
            }}
          />
        )}
        {visibleFields.map((field) => {
          if (field.type === "subject") {
            // Hide the subject field but keep it as a hidden input with the form name as value
            return (
              <input
                key={field.name}
                type="hidden"
                name={field.name}
                value={(field.value as string) || ""}
              />
            );
          } else if (field.type === "description") {
            return (
              <Fragment key={field.name}>
                <TextArea
                  field={field}
                  hasWysiwyg={wysiwyg}
                  baseLocale={baseLocale}
                  hasAtMentions={hasAtMentions}
                  userRole={userRole}
                  brandId={brandId}
                  onChange={(value) => handleChange(field, value)}
                />
                <input
                  type="hidden"
                  name={description_mimetype_field.name}
                  value={wysiwyg ? "text/html" : "text/plain"}
                />
              </Fragment>
            );
          } else {
            return (
              <RequestFormField
                key={field.name}
                field={field}
                baseLocale={baseLocale}
                hasAtMentions={hasAtMentions}
                userRole={userRole}
                userId={userId}
                brandId={brandId}
                dueDateField={dueDateField}
                handleDueDateChange={handleDueDateChange}
                organizationField={organizationField}
                defaultOrganizationId={defaultOrganizationId}
                visibleFields={visibleFields}
                handleChange={handleChange}
              />
            );
          }
        })}
        {attachments_field && (
          <Attachments field={attachments_field} baseLocale={baseLocale} />
        )}
        {inline_attachments_fields.map(({ type, name, value }, index) => (
          <input key={index} type={type} name={name} value={value} />
        ))}
        <Footer>
          {(ticket_form_field.options.length === 0 ||
            ticket_form_field.value) && (
            <Button isPrimary type="submit">
              {t("new-request-form.submit", "Submit")}
            </Button>
          )}
        </Footer>
      </Form>
      {answerBotModalEnabled && (
        <AnswerBotModal
          authToken={answerBot.auth_token!}
          interactionAccessToken={answerBot.interaction_access_token!}
          articles={answerBot.articles!}
          requestId={answerBot.request_id!}
          {...answerBotModal}
        />
      )}
      {answerBotGenerativeModalEnabled && (
        <GenerativeAnswerBotModal
          requestId={Number(answerBot.request_id)}
          redirectTo={answerBotModal.helpCenterPath}
        />
      )}
    </>
  );
}
