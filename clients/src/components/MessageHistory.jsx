import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import ScrollableFeed from "react-scrollable-feed";
import { isSameSender, isSameSenderMargin, isSameUser, isLastMessage } from '../utils/logics';
import { Tooltip } from "@chakra-ui/tooltip";
import { Avatar } from "@chakra-ui/avatar";
import { Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, useDisclosure } from "@chakra-ui/react";
import "../pages/home.css";

function MessageHistory({ messages }) {
  const activeUser = useSelector((state) => state.activeUser);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (imageSrc) => {
    setSelectedImage(imageSrc);
    onOpen();
  };

  return (
    <>
      <ScrollableFeed className='scrollbar-hide'>
        {messages &&
          messages.map((m, i) => {
            return (
              <div className='flex items-center gap-x-[6px]' key={m._id}>
                {(isSameSender(messages, m, i, activeUser.id) ||
                  isLastMessage(messages, i, activeUser.id)) && (
                    <Tooltip label={m.sender?.name} placement="bottom-start" hasArrow>
                      <Avatar
                        style={{ width: "32px", height: "32px" }}
                        mt="43px"
                        mr={1}
                        cursor="pointer"
                        name={m.sender?.name}
                        src={m.sender?.profilePic}
                        borderRadius="25px"
                      />
                    </Tooltip>
                  )}
                <span
                  className='tracking-wider text-[15px] font-medium'
                  style={{
                    backgroundColor: `${m.sender._id === activeUser.id ? "#268d61" : "#f0f0f0"}`,
                    marginLeft: isSameSenderMargin(messages, m, i, activeUser.id),
                    marginTop: isSameUser(messages, m, i, activeUser.id) ? 3 : 10,
                    borderRadius: `${m.sender._id === activeUser.id ? "10px 10px 0px 10px" : "10px 10px 10px 0"}`,
                    padding: m.image ? "5px" : "10px 18px",
                    maxWidth: "460px",
                    color: `${m.sender._id === activeUser.id ? "#ffff" : "#848587"}`,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {m.image ? (
                    <img
                      src={m.image}
                      alt="uploaded"
                      style={{
                        maxWidth: "100%",
                        borderRadius: "10px",
                        maxHeight: "200px",
                        cursor: "pointer",
                      }}
                      onClick={() => handleImageClick(m.image)}
                    />
                  ) : (
                    m.message
                  )}
                </span>
              </div>
            );
          })}
      </ScrollableFeed>

     
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody className="flex justify-center items-center">
            <img src={selectedImage} alt="Preview" className="max-w-full max-h-[80vh] rounded-lg" />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default MessageHistory;
