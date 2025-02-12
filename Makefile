all: install-alertmanager
	docker-compose up --build -d
	@echo "$(ORG) ----- The project is run, check $(CYAN) http://localhost:80 $(ORG)-----$(RESET)"

stop:
	@echo "$(ORG)----- Stoping containers$(MAGENTA) $(SERVICES) $(ORG) -----$(RESET)"
	docker-compose down

init_script:
	@./script/init_docker.sh

reload: stop all

clean:
	@echo "$(ORG)----- Cleaning stopped containers... -----$(RESET)"
	@docker-compose rm 
	
	@echo "$(ORG)----- Cleaning unused images... -----$(RESET)"	# @docker image prune -f
	@docker container prune -f


fclean:
	@echo "$(ORG)----- Stoping containers$(MAGENTA) $(SERVICES) $(ORG) -----$(RESET)"
	docker-compose down -v
	@echo "$(ORG)----- Cleaning project docker initioation$(MAGENTA) $(SERVICES) $(ORG) -----$(RESET)"
	docker system prune -f
	docker image prune -af

install-alertmanager:
	chmod +x ./provisioning/alertmanager/install.sh
	./provisioning/alertmanager/install.sh


re: fclean  install-alertmanager all

BLUE    = \033[38;5;4m
GREEN   = \033[38;5;2m
ORG     = \033[38;5;214m
RED     = \033[38;5;196m
RESET   = \033[0m
CYAN	= \033[38;5;44m
MAGENTA	= \033[38;5;5m